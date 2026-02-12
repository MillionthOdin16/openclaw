import { diagnosticLogger as diag, logLaneDequeue, logLaneEnqueue } from "../logging/diagnostic.js";
import { CommandLane } from "./lanes.js";
/**
 * Dedicated error type thrown when a queued command is rejected because
 * its lane was cleared.  Callers that fire-and-forget enqueued tasks can
 * catch (or ignore) this specific type to avoid unhandled-rejection noise.
 */
export class CommandLaneClearedError extends Error {
  constructor(lane?: string) {
    super(lane ? `Command lane "${lane}" cleared` : "Command lane cleared");
    this.name = "CommandLaneClearedError";
  }
}

// Minimal in-process queue to serialize command executions.
// Default lane ("main") preserves the existing behavior. Additional lanes allow
// low-risk parallelism (e.g. cron jobs) without interleaving stdin / logs for
// the main auto-reply workflow.

// TTL for inactive lanes before they can be cleaned up.
// Lanes that have been idle (no active tasks, empty queue) for this long
// can be removed to prevent unbounded memory growth. See GitHub issue #5264.
const LANE_IDLE_TTL_MS = 30 * 60_000; // 30 minutes

// Maximum number of lanes to keep in memory. When exceeded, oldest idle
// lanes are evicted. This prevents OOM in long-running processes.
const MAX_LANE_COUNT = 1000;
// Maximum time a lane task can run before being forcefully terminated.
// This prevents deadlocks when nested queue patterns hang (e.g., session lane
// waiting for global lane that never completes). See GitHub issue #7630.
const LANE_TASK_TIMEOUT_MS = 10 * 60_000; // 10 minutes

const SYSTEM_LANES = new Set<string>([
  CommandLane.Main,
  CommandLane.Cron,
  CommandLane.Subagent,
  CommandLane.Nested,
]);

type QueueEntry = {
  task: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  enqueuedAt: number;
  warnAfterMs: number;
  onWait?: (waitMs: number, queuedAhead: number) => void;
};

type LaneState = {
  lane: string;
  queue: QueueEntry[];
  activeTaskIds: Set<number>;
  maxConcurrent: number;
  draining: boolean;
  generation: number;
  active: number;
  /** Timestamp of last activity (task start/complete) for TTL-based cleanup. See issue #5264. */
  lastActivityAt: number;
};

const lanes = new Map<string, LaneState>();
let nextTaskId = 1;

function getLaneState(lane: string): LaneState {
  const existing = lanes.get(lane);
  if (existing) {
    return existing;
  }
  const created: LaneState = {
    lane,
    queue: [],
    activeTaskIds: new Set(),
    maxConcurrent: 1,
    draining: false,
    generation: 0,
    active: 0,
    lastActivityAt: Date.now(),
  };
  lanes.set(lane, created);
  return created;
}

function completeTask(state: LaneState, taskId: number, taskGeneration: number): boolean {
  if (taskGeneration !== state.generation) {
    return false;
  }
  state.activeTaskIds.delete(taskId);
  state.active = Math.max(0, state.active - 1);
  state.lastActivityAt = Date.now();
  return true;
}

/**
 * Remove a lane from the map. Returns true if a lane was removed.
 */
export function removeCommandLane(lane: string): boolean {
  const cleaned = lane.trim() || CommandLane.Main;
  // Never remove system lanes
  if (SYSTEM_LANES.has(cleaned)) {
    return false;
  }
  const state = lanes.get(cleaned);
  if (!state) {
    return false;
  }
  // Only remove if idle (no active tasks, empty queue)
  if (state.active > 0 || state.queue.length > 0) {
    return false;
  }
  return lanes.delete(cleaned);
}

/**
 * Clean up idle lanes that haven't been active for the TTL period.
 * Returns the number of lanes removed.
 */
export function cleanupIdleLanes(): number {
  const now = Date.now();
  let removed = 0;
  for (const [laneKey, state] of lanes.entries()) {
    // Skip system lanes
    if (SYSTEM_LANES.has(laneKey)) {
      continue;
    }
    // Skip busy lanes
    if (state.active > 0 || state.queue.length > 0) {
      continue;
    }
    // Check TTL
    if (now - state.lastActivityAt > LANE_IDLE_TTL_MS) {
      if (lanes.delete(laneKey)) {
        removed++;
        diag.debug(`cleanupIdleLanes: removed idle lane=${laneKey}`);
      }
    }
  }
  return removed;
}

/**
 * Evict oldest idle lanes if we exceed the maximum lane count.
 * Returns the number of lanes evicted.
 */
export function evictExcessLanes(): number {
  if (lanes.size <= MAX_LANE_COUNT) {
    return 0;
  }
  // Collect idle lanes sorted by last activity (oldest first)
  const idleLanes: Array<{ key: string; lastActivityAt: number }> = [];
  for (const [laneKey, state] of lanes.entries()) {
    // Skip system lanes
    if (SYSTEM_LANES.has(laneKey)) {
      continue;
    }
    // Only consider idle lanes
    if (state.active === 0 && state.queue.length === 0) {
      idleLanes.push({ key: laneKey, lastActivityAt: state.lastActivityAt });
    }
  }
  // Sort by last activity (oldest first)
  idleLanes.sort((a, b) => a.lastActivityAt - b.lastActivityAt);

  const toEvict = lanes.size - MAX_LANE_COUNT;
  let evicted = 0;
  for (const { key } of idleLanes.slice(0, toEvict)) {
    if (lanes.delete(key)) {
      evicted++;
      diag.debug(`evictExcessLanes: evicted idle lane=${key}`);
    }
  }
  return evicted;
}

/**
 * Get statistics about lanes for monitoring.
 */
export function getLaneStats(): {
  totalLanes: number;
  idleLanes: number;
  busyLanes: number;
  systemLanes: number;
} {
  let idleLanes = 0;
  let busyLanes = 0;
  let systemLanes = 0;
  for (const [laneKey, state] of lanes.entries()) {
    if (SYSTEM_LANES.has(laneKey)) {
      systemLanes++;
      continue;
    }
    if (state.active === 0 && state.queue.length === 0) {
      idleLanes++;
    } else {
      busyLanes++;
    }
  }
  return {
    totalLanes: lanes.size,
    idleLanes,
    busyLanes,
    systemLanes,
  };
}

function drainLane(lane: string) {
  const state = getLaneState(lane);
  if (state.draining) {
    return;
  }
  state.draining = true;

  const pump = () => {
    while (state.activeTaskIds.size < state.maxConcurrent && state.queue.length > 0) {
      const entry = state.queue.shift() as QueueEntry;
      const waitedMs = Date.now() - entry.enqueuedAt;
      if (waitedMs >= entry.warnAfterMs) {
        entry.onWait?.(waitedMs, state.queue.length);
        diag.warn(
          `lane wait exceeded: lane=${lane} waitedMs=${waitedMs} queueAhead=${state.queue.length}`,
        );
      }
      logLaneDequeue(lane, waitedMs, state.queue.length);
      const taskId = nextTaskId++;
      const taskGeneration = state.generation;
      state.active += 1;
      state.activeTaskIds.add(taskId);

      // Track task execution with timeout to prevent deadlocks
      // See GitHub issue #7630: nested queue pattern can hang indefinitely
      let timeoutId: NodeJS.Timeout | undefined;
      let completed = false;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = undefined;
        }
      };

      const handleTimeout = () => {
        if (completed) {
          return;
        }
        completed = true;
        cleanup();
        const completedCurrentGeneration = completeTask(state, taskId, taskGeneration);
        diag.error(
          `lane task timeout: lane=${lane} maxDurationMs=${LANE_TASK_TIMEOUT_MS} - forcefully releasing lane slot`,
        );
        if (completedCurrentGeneration) {
          pump();
        }
        entry.reject(new Error(`Lane task timed out after ${LANE_TASK_TIMEOUT_MS}ms`));
      };

      timeoutId = setTimeout(handleTimeout, LANE_TASK_TIMEOUT_MS);

      void (async () => {
        const startTime = Date.now();
        try {
          const result = await entry.task();
          if (completed) {
            // Task completed after timeout already fired - don't double-resolve
            return;
          }
          completed = true;
          cleanup();
          const completedCurrentGeneration = completeTask(state, taskId, taskGeneration);
          diag.debug(
            `lane task done: lane=${lane} durationMs=${Date.now() - startTime} active=${state.activeTaskIds.size} queued=${state.queue.length}`,
          );
          if (completedCurrentGeneration) {
            pump();
          }
          entry.resolve(result);
        } catch (err) {
          if (completed) {
            // Error after timeout already fired - ignore
            return;
          }
          completed = true;
          cleanup();
          const completedCurrentGeneration = completeTask(state, taskId, taskGeneration);
          const isProbeLane = lane.startsWith("auth-probe:") || lane.startsWith("session:probe-");
          if (!isProbeLane) {
            diag.error(
              `lane task error: lane=${lane} durationMs=${Date.now() - startTime} error="${String(err)}"`,
            );
          }
          if (completedCurrentGeneration) {
            pump();
          }
          entry.reject(err);
        }
      })();
    }
    state.draining = false;
  };

  pump();
}

export function setCommandLaneConcurrency(lane: string, maxConcurrent: number) {
  const cleaned = lane.trim() || CommandLane.Main;
  const state = getLaneState(cleaned);
  state.maxConcurrent = Math.max(1, Math.floor(maxConcurrent));
  drainLane(cleaned);
}

export function enqueueCommandInLane<T>(
  lane: string,
  task: () => Promise<T>,
  opts?: {
    warnAfterMs?: number;
    onWait?: (waitMs: number, queuedAhead: number) => void;
  },
): Promise<T> {
  const cleaned = lane.trim() || CommandLane.Main;
  const warnAfterMs = opts?.warnAfterMs ?? 2_000;
  const state = getLaneState(cleaned);
  return new Promise<T>((resolve, reject) => {
    state.queue.push({
      task: () => task(),
      resolve: (value) => resolve(value as T),
      reject,
      enqueuedAt: Date.now(),
      warnAfterMs,
      onWait: opts?.onWait,
    });
    logLaneEnqueue(cleaned, state.queue.length + state.activeTaskIds.size);
    drainLane(cleaned);
  });
}

export function enqueueCommand<T>(
  task: () => Promise<T>,
  opts?: {
    warnAfterMs?: number;
    onWait?: (waitMs: number, queuedAhead: number) => void;
  },
): Promise<T> {
  return enqueueCommandInLane(CommandLane.Main, task, opts);
}

export function getQueueSize(lane: string = CommandLane.Main) {
  const resolved = lane.trim() || CommandLane.Main;
  const state = lanes.get(resolved);
  if (!state) {
    return 0;
  }
  return state.queue.length + state.activeTaskIds.size;
}

export function getTotalQueueSize() {
  let total = 0;
  for (const s of lanes.values()) {
    total += s.queue.length + s.activeTaskIds.size;
  }
  return total;
}

export function clearCommandLane(lane: string = CommandLane.Main) {
  const cleaned = lane.trim() || CommandLane.Main;
  const state = lanes.get(cleaned);
  if (!state) {
    return 0;
  }
  const removed = state.queue.length;
  const pending = state.queue.splice(0);
  for (const entry of pending) {
    entry.reject(new CommandLaneClearedError(cleaned));
  }
  return removed;
}

/**
 * Reset all lane runtime state to idle. Used after SIGUSR1 in-process
 * restarts where interrupted tasks' finally blocks may not run, leaving
 * stale active task IDs that permanently block new work from draining.
 *
 * Bumps lane generation and clears execution counters so stale completions
 * from old in-flight tasks are ignored. Queued entries are intentionally
 * preserved — they represent pending user work that should still execute
 * after restart.
 *
 * After resetting, drains any lanes that still have queued entries so
 * preserved work is pumped immediately rather than waiting for a future
 * `enqueueCommandInLane()` call (which may never come).
 */
export function resetAllLanes(): void {
  const lanesToDrain: string[] = [];
  for (const state of lanes.values()) {
    state.generation += 1;
    state.activeTaskIds.clear();
    state.active = 0;
    state.lastActivityAt = Date.now();
    state.draining = false;
    if (state.queue.length > 0) {
      lanesToDrain.push(state.lane);
    }
  }
  // Drain after the full reset pass so all lanes are in a clean state first.
  for (const lane of lanesToDrain) {
    drainLane(lane);
  }
}

/**
 * Returns the total number of actively executing tasks across all lanes
 * (excludes queued-but-not-started entries).
 */
export function getActiveTaskCount(): number {
  let total = 0;
  for (const s of lanes.values()) {
    total += s.activeTaskIds.size;
  }
  return total;
}

/**
 * Wait for all currently active tasks across all lanes to finish.
 * Polls at a short interval; resolves when no tasks are active or
 * when `timeoutMs` elapses (whichever comes first).
 *
 * New tasks enqueued after this call are ignored — only tasks that are
 * already executing are waited on.
 */
export function waitForActiveTasks(timeoutMs: number): Promise<{ drained: boolean }> {
  // Keep shutdown/drain checks responsive without busy looping.
  const POLL_INTERVAL_MS = 50;
  const deadline = Date.now() + timeoutMs;
  const activeAtStart = new Set<number>();
  for (const state of lanes.values()) {
    for (const taskId of state.activeTaskIds) {
      activeAtStart.add(taskId);
    }
  }

  return new Promise((resolve) => {
    const check = () => {
      if (activeAtStart.size === 0) {
        resolve({ drained: true });
        return;
      }

      let hasPending = false;
      for (const state of lanes.values()) {
        for (const taskId of state.activeTaskIds) {
          if (activeAtStart.has(taskId)) {
            hasPending = true;
            break;
          }
        }
        if (hasPending) {
          break;
        }
      }

      if (!hasPending) {
        resolve({ drained: true });
        return;
      }
      if (Date.now() >= deadline) {
        resolve({ drained: false });
        return;
      }
      setTimeout(check, POLL_INTERVAL_MS);
    };
    check();
  });
}

/**
 * Remove a lane from the map. Returns true if a lane was removed.
 */
export function removeCommandLane(lane: string): boolean {
  const cleaned = lane.trim() || CommandLane.Main;
  // Never remove system lanes
  if (
    cleaned === CommandLane.Main ||
    cleaned === CommandLane.Cron ||
    cleaned === CommandLane.Subagent ||
    cleaned === CommandLane.Nested
  ) {
    return false;
  }
  const state = lanes.get(cleaned);
  if (!state) {
    return false;
  }
  // Only remove if idle (no active tasks, empty queue)
  if (state.active > 0 || state.queue.length > 0) {
    return false;
  }
  return lanes.delete(cleaned);
}

/**
 * Clean up idle lanes that haven't been active for the TTL period.
 * Returns the number of lanes removed.
 */
export function cleanupIdleLanes(): number {
  const now = Date.now();
  let removed = 0;
  for (const [laneKey, state] of lanes.entries()) {
    // Skip system lanes
    if (
      laneKey === CommandLane.Main ||
      laneKey === CommandLane.Cron ||
      laneKey === CommandLane.Subagent ||
      laneKey === CommandLane.Nested
    ) {
      continue;
    }
    // Skip busy lanes
    if (state.active > 0 || state.queue.length > 0) {
      continue;
    }
    // Check TTL
    if (now - state.lastActivityAt > LANE_IDLE_TTL_MS) {
      if (lanes.delete(laneKey)) {
        removed++;
        diag.debug(`cleanupIdleLanes: removed idle lane=${laneKey}`);
      }
    }
  }
  return removed;
}

/**
 * Evict oldest idle lanes if we exceed the maximum lane count.
 * Returns the number of lanes evicted.
 */
export function evictExcessLanes(): number {
  if (lanes.size <= MAX_LANE_COUNT) {
    return 0;
  }
  // Collect idle lanes sorted by last activity (oldest first)
  const idleLanes: Array<{ key: string; lastActivityAt: number }> = [];
  for (const [laneKey, state] of lanes.entries()) {
    // Skip system lanes
    if (
      laneKey === CommandLane.Main ||
      laneKey === CommandLane.Cron ||
      laneKey === CommandLane.Subagent ||
      laneKey === CommandLane.Nested
    ) {
      continue;
    }
    // Only consider idle lanes
    if (state.active === 0 && state.queue.length === 0) {
      idleLanes.push({ key: laneKey, lastActivityAt: state.lastActivityAt });
    }
  }
  // Sort by last activity (oldest first)
  idleLanes.sort((a, b) => a.lastActivityAt - b.lastActivityAt);

  const toEvict = lanes.size - MAX_LANE_COUNT;
  let evicted = 0;
  for (const { key } of idleLanes.slice(0, toEvict)) {
    if (lanes.delete(key)) {
      evicted++;
      diag.debug(`evictExcessLanes: evicted idle lane=${key}`);
    }
  }
  return evicted;
}

/**
 * Get statistics about lanes for monitoring.
 */
export function getLaneStats(): {
  totalLanes: number;
  idleLanes: number;
  busyLanes: number;
  systemLanes: number;
} {
  let idleLanes = 0;
  let busyLanes = 0;
  let systemLanes = 0;
  for (const [laneKey, state] of lanes.entries()) {
    if (
      laneKey === CommandLane.Main ||
      laneKey === CommandLane.Cron ||
      laneKey === CommandLane.Subagent ||
      laneKey === CommandLane.Nested
    ) {
      systemLanes++;
    } else if (state.active > 0 || state.queue.length > 0) {
      busyLanes++;
    } else {
      idleLanes++;
    }
  }
  return { totalLanes: lanes.size, idleLanes, busyLanes, systemLanes };
}
