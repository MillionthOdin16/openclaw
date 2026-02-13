import { diagnosticLogger as diag, logLaneDequeue, logLaneEnqueue } from "../logging/diagnostic.js";
import { CommandLane } from "./lanes.js";

// TTL for inactive lanes before they can be cleaned up.
// Lanes that have been idle (no active tasks, empty queue) for this long
// can be removed to prevent unbounded memory growth. See GitHub issue #5264.
const LANE_IDLE_TTL_MS = 30 * 60_000; // 30 minutes

// Maximum number of lanes to keep in memory. When exceeded, oldest idle
// lanes are evicted. This prevents OOM in long-running processes.
const MAX_LANE_COUNT = 1000;

// Minimal in-process queue to serialize command executions.
// Default lane ("main") preserves the existing behavior. Additional lanes allow
// low-risk parallelism (e.g. cron jobs) without interleaving stdin / logs for
// the main auto-reply workflow.

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
  active: number;
  activeTaskIds: Set<number>;
  maxConcurrent: number;
  draining: boolean;
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
    active: 0,
    activeTaskIds: new Set(),
    maxConcurrent: 1,
    draining: false,
    lastActivityAt: Date.now(),
  };
  lanes.set(lane, created);
  return created;
}

function drainLane(lane: string) {
  const state = getLaneState(lane);
  if (state.draining) {
    return;
  }
  state.draining = true;

  const pump = () => {
    while (state.active < state.maxConcurrent && state.queue.length > 0) {
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
      state.active += 1;
      state.lastActivityAt = Date.now();
      state.activeTaskIds.add(taskId);
      void (async () => {
        const startTime = Date.now();
        try {
          const result = await entry.task();
          state.active -= 1;
          state.lastActivityAt = Date.now();
          state.activeTaskIds.delete(taskId);
          diag.debug(
            `lane task done: lane=${lane} durationMs=${Date.now() - startTime} active=${state.active} queued=${state.queue.length}`,
          );
          pump();
          entry.resolve(result);
        } catch (err) {
          state.active -= 1;
          state.lastActivityAt = Date.now();
          state.activeTaskIds.delete(taskId);
          const isProbeLane = lane.startsWith("auth-probe:") || lane.startsWith("session:probe-");
          if (!isProbeLane) {
            diag.error(
              `lane task error: lane=${lane} durationMs=${Date.now() - startTime} error="${String(err)}"`,
            );
          }
          pump();
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
    logLaneEnqueue(cleaned, state.queue.length + state.active);
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
  return state.queue.length + state.active;
}

export function getTotalQueueSize() {
  let total = 0;
  for (const s of lanes.values()) {
    total += s.queue.length + s.active;
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
  state.queue.length = 0;
  return removed;
}

/**
 * Returns the total number of actively executing tasks across all lanes
 * (excludes queued-but-not-started entries).
 */
export function getActiveTaskCount(): number {
  let total = 0;
  for (const s of lanes.values()) {
    total += s.active;
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
  const POLL_INTERVAL_MS = 250;
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
