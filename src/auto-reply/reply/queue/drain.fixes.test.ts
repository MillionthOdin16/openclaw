/**
 * Queue fixes verification test
 * Run with: pnpm test src/auto-reply/reply/queue.fixes.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { OpenClawConfig } from "../../../config/config.js";
import type { FollowupRun, QueueSettings } from "./types.js";
import { scheduleFollowupDrain, getQueueDiagnostics, forceClearStuckQueue } from "./drain.js";
import { FOLLOWUP_QUEUES, clearFollowupQueue, getFollowupQueue } from "./state.js";

describe("Queue Drain Fixes", () => {
  const testKey = "test-queue";
  const defaultSettings: QueueSettings = {
    mode: "followup",
    debounceMs: 100, // Short for testing
    cap: 10,
    dropPolicy: "summarize",
  };

  beforeEach(() => {
    clearFollowupQueue(testKey);
  });

  afterEach(() => {
    clearFollowupQueue(testKey);
  });

  it("should timeout long-running drains", async () => {
    const queue = getFollowupQueue(testKey, defaultSettings);

    // Add items to queue
    queue.items.push(createTestRun("msg1"));

    scheduleFollowupDrain(testKey, async () => {
      // Simulate slow processing
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Wait for drain to complete or timeout
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Verify drain completed (not stuck)
    expect(queue.draining).toBe(false);
  });

  it("should stop retrying after max retries", async () => {
    const queue = getFollowupQueue(testKey, defaultSettings);

    // Add items to queue
    queue.items.push(createTestRun("msg1"));

    let attempts = 0;

    // Simulate persistent failure
    scheduleFollowupDrain(testKey, async () => {
      attempts++;
      throw new Error("Simulated failure");
    });

    // Wait for retries
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Should have stopped retrying
    expect(attempts).toBeLessThanOrEqual(4); // Initial + 3 retries
    expect(queue.items.length).toBe(0); // Queue should be cleared
  });

  it("should provide queue diagnostics", () => {
    const queue = getFollowupQueue(testKey, defaultSettings);
    queue.items.push(createTestRun("msg1"));
    queue.items.push(createTestRun("msg2"));

    const diagnostics = getQueueDiagnostics();

    const testQueueDiag = diagnostics.find((d) => d.key === testKey);
    expect(testQueueDiag).toBeDefined();
    expect(testQueueDiag?.depth).toBe(2);
    expect(testQueueDiag?.draining).toBe(false);
  });

  it("should force clear stuck queues", () => {
    const queue = getFollowupQueue(testKey, defaultSettings);
    queue.items.push(createTestRun("msg1"));
    queue.draining = true;
    queue.lastEnqueuedAt = Date.now() - 120000; // 2 minutes ago

    const cleared = forceClearStuckQueue(testKey, 60000);

    expect(cleared).toBe(1);
    expect(FOLLOWUP_QUEUES.has(testKey)).toBe(false);
  });
});

function createTestRun(messageId: string): FollowupRun {
  return {
    prompt: `Test prompt for ${messageId}`,
    messageId,
    enqueuedAt: Date.now(),
    run: {
      sessionId: "test-session",
      sessionKey: "test-key",
      sessionFile: "/tmp/test.json",
      workspaceDir: "/tmp",
      config: {} as OpenClawConfig,
      provider: "test",
      model: "test-model",
      timeoutMs: 30000,
      blockReplyBreak: "message_end",
    },
  };
}
