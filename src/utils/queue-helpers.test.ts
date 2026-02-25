/**
 * Tests for queue-helpers utility.
 * Covers queue management, text truncation, and prompt building.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  elideQueueText,
  buildQueueSummaryLine,
  shouldSkipQueueItem,
  applyQueueDropPolicy,
  waitForQueueDebounce,
  buildQueueSummaryPrompt,
  buildCollectPrompt,
  hasCrossChannelItems,
  QueueState,
} from "./queue-helpers";

describe("queue-helpers", () => {
  describe("elideQueueText", () => {
    it("should return text as is if shorter than limit", () => {
      expect(elideQueueText("hello", 10)).toBe("hello");
    });

    it("should truncate text if longer than limit", () => {
      expect(elideQueueText("hello world", 5)).toBe("hell…");
    });

    it("should handle custom limit", () => {
      expect(elideQueueText("hello world", 8)).toBe("hello w…");
    });

    it("should handle very short limit", () => {
      expect(elideQueueText("hello", 1)).toBe("…");
    });
  });

  describe("buildQueueSummaryLine", () => {
    it("should clean whitespace", () => {
      expect(buildQueueSummaryLine("  hello   world  ")).toBe("hello world");
    });

    it("should truncate long lines", () => {
      const longText = "a".repeat(200);
      const result = buildQueueSummaryLine(longText, 10);
      expect(result.length).toBe(10);
      expect(result.endsWith("…")).toBe(true);
    });
  });

  describe("shouldSkipQueueItem", () => {
    it("should return false if no dedupe function provided", () => {
      expect(shouldSkipQueueItem({ item: 1, items: [1] })).toBe(false);
    });

    it("should use dedupe function if provided", () => {
      const dedupe = (item: number, items: number[]) => items.includes(item);
      expect(shouldSkipQueueItem({ item: 1, items: [1], dedupe })).toBe(true);
      expect(shouldSkipQueueItem({ item: 2, items: [1], dedupe })).toBe(false);
    });
  });

  describe("applyQueueDropPolicy", () => {
    it("should return true if queue is not full", () => {
      const queue: QueueState<number> = {
        dropPolicy: "old",
        droppedCount: 0,
        summaryLines: [],
        items: [1],
        cap: 2,
      };
      expect(applyQueueDropPolicy({ queue, summarize: (i) => String(i) })).toBe(true);
      expect(queue.items).toEqual([1]);
    });

    it("should return false if dropPolicy is 'new' and queue is full", () => {
      const queue: QueueState<number> = {
        dropPolicy: "new",
        droppedCount: 0,
        summaryLines: [],
        items: [1, 2],
        cap: 2,
      };
      expect(applyQueueDropPolicy({ queue, summarize: (i) => String(i) })).toBe(false);
    });

    it("should drop old items if dropPolicy is 'old'", () => {
      const queue: QueueState<number> = {
        dropPolicy: "old",
        droppedCount: 0,
        summaryLines: [],
        items: [1, 2],
        cap: 2,
      };
      // Expect 1 item to be dropped because logic is items.length - cap + 1 = 2 - 2 + 1 = 1
      expect(applyQueueDropPolicy({ queue, summarize: (i) => String(i) })).toBe(true);
      expect(queue.items.length).toBe(1);
      expect(queue.items[0]).toBe(2);
    });

    it("should summarize dropped items if dropPolicy is 'summarize'", () => {
      const queue: QueueState<number> = {
        dropPolicy: "summarize",
        droppedCount: 0,
        summaryLines: [],
        items: [1, 2],
        cap: 2,
      };

      expect(applyQueueDropPolicy({ queue, summarize: (i) => `item ${i}` })).toBe(true);
      expect(queue.items.length).toBe(1);
      expect(queue.items[0]).toBe(2);
      expect(queue.droppedCount).toBe(1);
      expect(queue.summaryLines).toEqual(["item 1"]);
    });
  });

  describe("waitForQueueDebounce", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should resolve immediately if debounceMs <= 0", async () => {
      const queue = { debounceMs: 0, lastEnqueuedAt: Date.now() };
      const promise = waitForQueueDebounce(queue);
      await expect(promise).resolves.toBeUndefined();
    });

    it("should wait if debounce time hasn't passed", async () => {
      const now = 1000;
      vi.setSystemTime(now);
      const queue = { debounceMs: 100, lastEnqueuedAt: now };

      let resolved = false;
      const promise = waitForQueueDebounce(queue).then(() => {
        resolved = true;
      });

      expect(resolved).toBe(false);

      // Advance time by 50ms (not enough)
      vi.advanceTimersByTime(50);
      expect(resolved).toBe(false);

      // Advance time by another 50ms (enough)
      vi.advanceTimersByTime(51);
      // We need to wait for the promise to resolve
      await promise;
      expect(resolved).toBe(true);
    });
  });

  describe("buildQueueSummaryPrompt", () => {
    it("should return undefined if no items dropped", () => {
      const state: QueueState<any> = {
        dropPolicy: "summarize",
        droppedCount: 0,
        summaryLines: [],
        items: [],
        cap: 10,
      };
      expect(buildQueueSummaryPrompt({ state, noun: "message" })).toBeUndefined();
    });

    it("should return summary string if items dropped", () => {
      const state: QueueState<any> = {
        dropPolicy: "summarize",
        droppedCount: 2,
        summaryLines: ["line 1", "line 2"],
        items: [],
        cap: 10,
      };
      const result = buildQueueSummaryPrompt({ state, noun: "message" });
      expect(result).toContain("Dropped 2 messages");
      expect(result).toContain("- line 1");
      expect(result).toContain("- line 2");

      // Should reset state
      expect(state.droppedCount).toBe(0);
      expect(state.summaryLines).toEqual([]);
    });
  });

  describe("buildCollectPrompt", () => {
    it("should build prompt with items", () => {
      const items = ["a", "b"];
      const result = buildCollectPrompt({
        title: "Title",
        items,
        renderItem: (item, idx) => `${idx}: ${item}`,
      });
      expect(result).toContain("Title");
      expect(result).toContain("0: a");
      expect(result).toContain("1: b");
    });

    it("should include summary if provided", () => {
      const result = buildCollectPrompt({
        title: "Title",
        items: [],
        summary: "Summary text",
        renderItem: (i) => i,
      });
      expect(result).toContain("Summary text");
    });
  });

  describe("hasCrossChannelItems", () => {
    it("should return false for single channel items", () => {
      const items = [
        { id: 1, channel: "a" },
        { id: 2, channel: "a" },
      ];
      expect(hasCrossChannelItems(items, (i) => ({ key: i.channel }))).toBe(false);
    });

    it("should return true for multiple channel items", () => {
      const items = [
        { id: 1, channel: "a" },
        { id: 2, channel: "b" },
      ];
      expect(hasCrossChannelItems(items, (i) => ({ key: i.channel }))).toBe(true);
    });

    it("should return true if any item is marked cross", () => {
      const items = [{ id: 1, cross: true }];
      expect(hasCrossChannelItems(items, (i) => ({ cross: i.cross }))).toBe(true);
    });

    it("should return true if mixed keyed and unkeyed items", () => {
      const items = [{ id: 1, channel: "a" }, { id: 2 }];
      expect(hasCrossChannelItems(items, (i) => ({ key: i.channel }))).toBe(true);
    });
  });
});
