import type { FollowupRun } from "./types.js";
import { defaultRuntime } from "../../../runtime.js";
import {
  buildCollectPrompt,
  clearQueueSummaryState,
  drainCollectItemIfNeeded,
  drainNextQueueItem,
  hasCrossChannelItems,
  previewQueueSummaryPrompt,
  waitForQueueDebounce,
} from "../../../utils/queue-helpers.js";
import { isRoutableChannel } from "../route-reply.js";
import { FOLLOWUP_QUEUES } from "./state.js";

const MAX_DRAIN_RETRIES = 3;
const DRAIN_TIMEOUT_MS = 30000; // 30 seconds max per drain cycle

export function scheduleFollowupDrain(
  key: string,
  runFollowup: (run: FollowupRun) => Promise<void>,
): void {
  const queue = FOLLOWUP_QUEUES.get(key);
  if (!queue || queue.draining) {
    return;
  }
  queue.draining = true;
  const drainStartTime = Date.now();
  const retryCount = ((queue as Record<string, unknown>)._retryCount as number) ?? 0;

  void (async () => {
    try {
      let forceIndividualCollect = false;
      while (queue.items.length > 0 || queue.droppedCount > 0) {
        await waitForQueueDebounce(queue);

        // Double-check that we still have items after debounce
        if (queue.items.length === 0 && queue.droppedCount === 0) {
          break;
        }

        if (queue.mode === "collect") {
          // Once the batch is mixed, never collect again within this drain.
          // Prevents "collect after shift" collapsing different targets.
          //
          // Debug: `pnpm test src/auto-reply/reply/queue.collect-routing.test.ts`
          // Check if messages span multiple channels.
          // If so, process individually to preserve per-message routing.
          const isCrossChannel = hasCrossChannelItems(queue.items, (item) => {
            const channel = item.originatingChannel;
            const to = item.originatingTo;
            const accountId = item.originatingAccountId;
            const threadId = item.originatingThreadId;
            if (!channel && !to && !accountId && threadId == null) {
              return {};
            }
            if (!isRoutableChannel(channel) || !to) {
              return { cross: true };
            }
            const threadKey = threadId != null ? String(threadId) : "";
            return {
              key: [channel, to, accountId || "", threadKey].join("|"),
            };
          });

          const collectDrainResult = await drainCollectItemIfNeeded({
            forceIndividualCollect,
            isCrossChannel,
            setForceIndividualCollect: (next) => {
              forceIndividualCollect = next;
            },
            items: queue.items,
            run: runFollowup,
          });
          if (collectDrainResult === "empty") {
            break;
          }
          if (collectDrainResult === "drained") {
            continue;
          }

          const items = queue.items.slice();
          const processedCount = items.length;
          const summary = previewQueueSummaryPrompt({ state: queue, noun: "message" });
          const run = items.at(-1)?.run ?? queue.lastRun;
          if (!run) {
            continue;
          }

          // Preserve originating channel from items when collecting same-channel.
          const originatingChannel = items.find((i) => i.originatingChannel)?.originatingChannel;
          const originatingTo = items.find((i) => i.originatingTo)?.originatingTo;
          const originatingAccountId = items.find(
            (i) => i.originatingAccountId,
          )?.originatingAccountId;
          const originatingThreadId = items.find(
            (i) => i.originatingThreadId != null,
          )?.originatingThreadId;

          const prompt = buildCollectPrompt({
            title: "[Queued messages while agent was busy]",
            items,
            summary,
            renderItem: (item, idx) => `---\nQueued #${idx + 1}\n${item.prompt}`.trim(),
          });
          await runFollowup({
            prompt,
            run,
            enqueuedAt: Date.now(),
            originatingChannel,
            originatingTo,
            originatingAccountId,
            originatingThreadId,
          });
          queue.items.splice(0, processedCount);
          if (summary) {
            clearQueueSummaryState(queue);
          }
          continue; // After collect processing, skip to next iteration
        }

        const summaryPrompt = previewQueueSummaryPrompt({ state: queue, noun: "message" });
        if (summaryPrompt) {
          const run = queue.lastRun;
          if (!run) {
            continue; // Continue instead of break to check for newly added items
          }
          if (
            !(await drainNextQueueItem(queue.items, async () => {
              await runFollowup({
                prompt: summaryPrompt,
                run,
                enqueuedAt: Date.now(),
              });
            }))
          ) {
            break;
          }
          clearQueueSummaryState(queue);
          continue;
        }

        if (!(await drainNextQueueItem(queue.items, runFollowup))) {
          break;
        }

        // Check for timeout - exit drain cycle if taking too long
        const elapsed = Date.now() - drainStartTime;
        if (elapsed > DRAIN_TIMEOUT_MS) {
          defaultRuntime.log?.(
            `[WARN] followup queue drain cycle timeout (${elapsed}ms) for ${key}, pausing`,
          );
          break;
        }
      }
    } catch (err) {
      queue.lastEnqueuedAt = Date.now();
      (queue as Record<string, unknown>)._retryCount = retryCount + 1;
      defaultRuntime.error?.(`followup queue drain failed for ${key}: ${String(err)}`);

      // Max retries exceeded - log and clear queue to prevent infinite loops
      if (((queue as Record<string, unknown>)._retryCount as number) >= MAX_DRAIN_RETRIES) {
        defaultRuntime.error?.(
          `followup queue max retries (${MAX_DRAIN_RETRIES}) exceeded for ${key}, clearing queue`,
        );
        queue.items.length = 0;
        queue.droppedCount = 0;
        queue.summaryLines = [];
        delete (queue as Record<string, unknown>)._retryCount;
      }
    } finally {
      queue.draining = false;
      if (queue.items.length === 0 && queue.droppedCount === 0) {
        delete (queue as Record<string, unknown>)._retryCount;
        FOLLOWUP_QUEUES.delete(key);
      } else {
        // Check for drain timeout
        const elapsed = Date.now() - drainStartTime;
        if (elapsed > DRAIN_TIMEOUT_MS) {
          defaultRuntime.log?.(
            `[WARN] followup queue drain timeout (${elapsed}ms) for ${key}, rescheduling`,
          );
        }
        scheduleFollowupDrain(key, runFollowup);
      }
    }
  })();
}

/**
 * Get diagnostic info about all followup queues.
 * Useful for debugging stuck messages.
 */
export function getQueueDiagnostics(): Array<{
  key: string;
  depth: number;
  draining: boolean;
  retryCount: number;
  lastEnqueuedAt: number;
  mode: string;
}> {
  const diagnostics: Array<{
    key: string;
    depth: number;
    draining: boolean;
    retryCount: number;
    lastEnqueuedAt: number;
    mode: string;
  }> = [];

  for (const [key, queue] of FOLLOWUP_QUEUES) {
    diagnostics.push({
      key,
      depth: queue.items.length,
      draining: queue.draining,
      retryCount: ((queue as Record<string, unknown>)._retryCount as number) ?? 0,
      lastEnqueuedAt: queue.lastEnqueuedAt,
      mode: queue.mode,
    });
  }

  return diagnostics;
}

/**
 * Clear a stuck queue that has been draining too long.
 * Returns the number of items cleared.
 */
export function forceClearStuckQueue(key: string, maxDrainingMs = 60000): number {
  const queue = FOLLOWUP_QUEUES.get(key);
  if (!queue) {
    return 0;
  }

  // Only clear if draining for too long
  if (queue.draining && queue.lastEnqueuedAt > 0) {
    const drainingMs = Date.now() - queue.lastEnqueuedAt;
    if (drainingMs > maxDrainingMs) {
      const cleared = queue.items.length + queue.droppedCount;
      defaultRuntime.log?.(
        `[WARN] Force clearing stuck queue ${key} (draining for ${drainingMs}ms, ${cleared} items)`,
      );
      queue.items.length = 0;
      queue.droppedCount = 0;
      queue.summaryLines = [];
      queue.draining = false;
      delete (queue as Record<string, unknown>)._retryCount;
      FOLLOWUP_QUEUES.delete(key);
      return cleared;
    }
  }

  return 0;
}
