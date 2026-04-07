import { describe, expect, it, vi } from "vitest";
import {
  applyQueueRuntimeSettings,
  buildQueueSummaryPrompt,
  clearQueueSummaryState,
  drainCollectItemIfNeeded,
  previewQueueSummaryPrompt,
  elideQueueText,
  buildQueueSummaryLine,
  shouldSkipQueueItem,
  applyQueueDropPolicy,
  waitForQueueDebounce,
  beginQueueDrain,
  drainNextQueueItem,
  drainCollectQueueStep,
  buildCollectPrompt,
  hasCrossChannelItems,
} from "./queue-helpers.js";

describe("applyQueueRuntimeSettings", () => {
  it("updates runtime queue settings with normalization", () => {
    const target = {
      mode: "followup" as const,
      debounceMs: 1000,
      cap: 20,
      dropPolicy: "summarize" as const,
    };

    applyQueueRuntimeSettings({
      target,
      settings: {
        mode: "collect",
        debounceMs: -12,
        cap: 9.8,
        dropPolicy: "new",
      },
    });

    expect(target).toEqual({
      mode: "collect",
      debounceMs: 0,
      cap: 9,
      dropPolicy: "new",
    });
  });

  it("keeps existing values when optional settings are missing/invalid", () => {
    const target = {
      mode: "followup" as const,
      debounceMs: 1000,
      cap: 20,
      dropPolicy: "summarize" as const,
    };

    applyQueueRuntimeSettings({
      target,
      settings: {
        mode: "queue",
        cap: 0,
      },
    });

    expect(target).toEqual({
      mode: "queue",
      debounceMs: 1000,
      cap: 20,
      dropPolicy: "summarize",
    });
  });
});

describe("queue summary helpers", () => {
  it("previewQueueSummaryPrompt does not mutate state", () => {
    const state = {
      dropPolicy: "summarize" as const,
      droppedCount: 2,
      summaryLines: ["first", "second"],
    };

    const prompt = previewQueueSummaryPrompt({
      state,
      noun: "message",
    });

    expect(prompt).toContain("[Queue overflow] Dropped 2 messages due to cap.");
    expect(prompt).toContain("first");
    expect(state).toEqual({
      dropPolicy: "summarize",
      droppedCount: 2,
      summaryLines: ["first", "second"],
    });
  });

  it("buildQueueSummaryPrompt clears state after rendering", () => {
    const state = {
      dropPolicy: "summarize" as const,
      droppedCount: 1,
      summaryLines: ["line"],
    };

    const prompt = buildQueueSummaryPrompt({
      state,
      noun: "announce",
    });

    expect(prompt).toContain("[Queue overflow] Dropped 1 announce due to cap.");
    expect(state).toEqual({
      dropPolicy: "summarize",
      droppedCount: 0,
      summaryLines: [],
    });
  });

  it("buildQueueSummaryPrompt returns undefined if dropPolicy is not summarize or droppedCount <= 0", () => {
    expect(
      buildQueueSummaryPrompt({
        state: { dropPolicy: "new", droppedCount: 1, summaryLines: [] },
        noun: "test",
      }),
    ).toBeUndefined();

    expect(
      buildQueueSummaryPrompt({
        state: { dropPolicy: "summarize", droppedCount: 0, summaryLines: [] },
        noun: "test",
      }),
    ).toBeUndefined();
  });

  it("clearQueueSummaryState resets summary counters", () => {
    const state = {
      dropPolicy: "summarize" as const,
      droppedCount: 5,
      summaryLines: ["a", "b"],
    };
    clearQueueSummaryState(state);
    expect(state.droppedCount).toBe(0);
    expect(state.summaryLines).toEqual([]);
  });
});

describe("elideQueueText", () => {
  it("returns original text if under limit", () => {
    expect(elideQueueText("hello", 10)).toBe("hello");
  });

  it("truncates text and adds ellipsis if over limit", () => {
    expect(elideQueueText("hello world", 5)).toBe("hell…");
    expect(elideQueueText("123", 2)).toBe("1…");
  });
});

describe("buildQueueSummaryLine", () => {
  it("cleans up whitespace and elides", () => {
    expect(buildQueueSummaryLine("  hello   \n world  ", 20)).toBe("hello world");
    expect(buildQueueSummaryLine("a  b c", 4)).toBe("a b…");
  });
});

describe("shouldSkipQueueItem", () => {
  it("returns false if no dedupe function", () => {
    expect(shouldSkipQueueItem({ item: 1, items: [1] })).toBe(false);
  });

  it("returns dedupe function result", () => {
    const dedupe = (item: number, items: number[]) => items.includes(item);
    expect(shouldSkipQueueItem({ item: 1, items: [1, 2], dedupe })).toBe(true);
    expect(shouldSkipQueueItem({ item: 3, items: [1, 2], dedupe })).toBe(false);
  });
});

describe("applyQueueDropPolicy", () => {
  it("returns true and does nothing if items < cap", () => {
    const queue = {
      items: [1, 2],
      cap: 3,
      dropPolicy: "summarize" as const,
      droppedCount: 0,
      summaryLines: [],
    };
    expect(applyQueueDropPolicy({ queue, summarize: (i) => String(i) })).toBe(true);
    expect(queue.items).toEqual([1, 2]);
  });

  it("returns false if over cap and dropPolicy is new", () => {
    const queue = {
      items: [1, 2, 3],
      cap: 2,
      dropPolicy: "new" as const,
      droppedCount: 0,
      summaryLines: [],
    };
    expect(applyQueueDropPolicy({ queue, summarize: (i) => String(i) })).toBe(false);
    expect(queue.items).toEqual([1, 2, 3]);
  });

  it("drops oldest items and summarizes if dropPolicy is summarize", () => {
    const queue = {
      items: [1, 2, 3],
      cap: 2,
      dropPolicy: "summarize" as const,
      droppedCount: 0,
      summaryLines: [],
    };
    expect(applyQueueDropPolicy({ queue, summarize: (i) => `sum ${i}` })).toBe(true);
    expect(queue.items).toEqual([3]);
    expect(queue.droppedCount).toBe(2);
    expect(queue.summaryLines).toEqual(["sum 1", "sum 2"]);
  });

  it("respects summaryLimit", () => {
    const queue = {
      items: [1, 2, 3, 4],
      cap: 2,
      dropPolicy: "summarize" as const,
      droppedCount: 0,
      summaryLines: [],
    };
    expect(applyQueueDropPolicy({ queue, summarize: (i) => `sum ${i}`, summaryLimit: 1 })).toBe(
      true,
    );
    expect(queue.items).toEqual([4]);
    expect(queue.summaryLines).toEqual(["sum 3"]);
  });

  it("drops oldest items and ignores summarize if dropPolicy is old", () => {
    const queue = {
      items: [1, 2, 3],
      cap: 2,
      dropPolicy: "old" as const,
      droppedCount: 0,
      summaryLines: [],
    };
    expect(applyQueueDropPolicy({ queue, summarize: (i) => `sum ${i}` })).toBe(true);
    expect(queue.items).toEqual([3]);
    expect(queue.droppedCount).toBe(0);
    expect(queue.summaryLines).toEqual([]);
  });
});

describe("waitForQueueDebounce", () => {
  it("returns immediately if OPENCLAW_TEST_FAST=1", async () => {
    const prev = process.env.OPENCLAW_TEST_FAST;
    process.env.OPENCLAW_TEST_FAST = "1";
    await expect(
      waitForQueueDebounce({ debounceMs: 1000000, lastEnqueuedAt: Date.now() }),
    ).resolves.toBeUndefined();
    process.env.OPENCLAW_TEST_FAST = prev;
  });

  it("returns immediately if debounce is 0 or negative", async () => {
    const prev = process.env.OPENCLAW_TEST_FAST;
    process.env.OPENCLAW_TEST_FAST = "0";
    await expect(
      waitForQueueDebounce({ debounceMs: 0, lastEnqueuedAt: Date.now() }),
    ).resolves.toBeUndefined();
    process.env.OPENCLAW_TEST_FAST = prev;
  });

  it("waits using setTimeout", async () => {
    const prev = process.env.OPENCLAW_TEST_FAST;
    process.env.OPENCLAW_TEST_FAST = "0";
    vi.useFakeTimers();

    // set Date.now() to a fixed value
    vi.setSystemTime(1000);

    const promise = waitForQueueDebounce({ debounceMs: 50, lastEnqueuedAt: 980 });

    // The elapsed time is 20ms, so it needs 30ms more.
    // Advancing 10ms should not resolve it.
    await vi.advanceTimersByTimeAsync(10);

    // Advancing 20ms more should resolve it.
    await vi.advanceTimersByTimeAsync(20);

    await expect(promise).resolves.toBeUndefined();

    vi.useRealTimers();
    process.env.OPENCLAW_TEST_FAST = prev;
  });

  it("resolves immediately if already elapsed", async () => {
    const prev = process.env.OPENCLAW_TEST_FAST;
    process.env.OPENCLAW_TEST_FAST = "0";
    vi.useFakeTimers();
    vi.setSystemTime(1000);

    await expect(
      waitForQueueDebounce({ debounceMs: 50, lastEnqueuedAt: 900 }),
    ).resolves.toBeUndefined();

    vi.useRealTimers();
    process.env.OPENCLAW_TEST_FAST = prev;
  });
});

describe("beginQueueDrain", () => {
  it("returns undefined if queue not found", () => {
    expect(beginQueueDrain(new Map(), "k")).toBeUndefined();
  });

  it("returns undefined if already draining", () => {
    const map = new Map([["k", { draining: true }]]);
    expect(beginQueueDrain(map, "k")).toBeUndefined();
  });

  it("sets draining to true and returns queue", () => {
    const q = { draining: false };
    const map = new Map([["k", q]]);
    expect(beginQueueDrain(map, "k")).toBe(q);
    expect(q.draining).toBe(true);
  });
});

describe("drainNextQueueItem", () => {
  it("returns false if items is empty", async () => {
    await expect(drainNextQueueItem([], async () => {})).resolves.toBe(false);
  });

  it("runs item, shifts items, and returns true", async () => {
    const items = [1, 2];
    const seen: number[] = [];
    const run = async (item: number) => {
      seen.push(item);
    };

    await expect(drainNextQueueItem(items, run)).resolves.toBe(true);
    expect(seen).toEqual([1]);
    expect(items).toEqual([2]);
  });
});

describe("drainCollectQueueStep", () => {
  it("delegates to drainCollectItemIfNeeded", async () => {
    const collectState = { forceIndividualCollect: false };
    const items = [1];
    let seen = 0;
    const run = async (i: number) => {
      seen = i;
    };

    // cross channel is true so it forces individual collect
    const res = await drainCollectQueueStep({
      collectState,
      isCrossChannel: true,
      items,
      run,
    });

    expect(res).toBe("drained");
    expect(collectState.forceIndividualCollect).toBe(true);
    expect(seen).toBe(1);
    expect(items).toEqual([]);
  });
});

describe("buildCollectPrompt", () => {
  it("builds prompt correctly with summary", () => {
    const prompt = buildCollectPrompt({
      title: "Title",
      items: ["A", "B"],
      summary: "Summary text",
      renderItem: (item, idx) => `Item ${idx}: ${item}`,
    });
    expect(prompt).toBe("Title\n\nSummary text\n\nItem 0: A\n\nItem 1: B");
  });

  it("builds prompt correctly without summary", () => {
    const prompt = buildCollectPrompt({
      title: "Title",
      items: ["A", "B"],
      renderItem: (item, idx) => `Item ${idx}: ${item}`,
    });
    expect(prompt).toBe("Title\n\nItem 0: A\n\nItem 1: B");
  });
});

describe("hasCrossChannelItems", () => {
  it("returns true if any item has cross: true", () => {
    expect(hasCrossChannelItems([{ a: 1 }], () => ({ cross: true }))).toBe(true);
  });

  it("returns false if no keys and all cross: false", () => {
    expect(hasCrossChannelItems([{ a: 1 }], () => ({ cross: false }))).toBe(false);
  });

  it("returns false if all same key and no unkeyed", () => {
    expect(hasCrossChannelItems([1, 2], () => ({ key: "k" }))).toBe(false);
  });

  it("returns true if same key but also unkeyed present", () => {
    expect(hasCrossChannelItems([1, 2], (i) => (i === 1 ? { key: "k" } : {}))).toBe(true);
  });

  it("returns true if multiple different keys", () => {
    expect(hasCrossChannelItems([1, 2], (i) => ({ key: `k${i}` }))).toBe(true);
  });
});

describe("drainCollectItemIfNeeded", () => {
  it("skips when neither force mode nor cross-channel routing is active", async () => {
    const seen: number[] = [];
    const items = [1];

    const result = await drainCollectItemIfNeeded({
      forceIndividualCollect: false,
      isCrossChannel: false,
      items,
      run: async (item) => {
        seen.push(item);
      },
    });

    expect(result).toBe("skipped");
    expect(seen).toEqual([]);
    expect(items).toEqual([1]);
  });

  it("drains one item in force mode", async () => {
    const seen: number[] = [];
    const items = [1, 2];

    const result = await drainCollectItemIfNeeded({
      forceIndividualCollect: true,
      isCrossChannel: false,
      items,
      run: async (item) => {
        seen.push(item);
      },
    });

    expect(result).toBe("drained");
    expect(seen).toEqual([1]);
    expect(items).toEqual([2]);
  });

  it("switches to force mode and returns empty when cross-channel with no queued item", async () => {
    let forced = false;

    const result = await drainCollectItemIfNeeded({
      forceIndividualCollect: false,
      isCrossChannel: true,
      setForceIndividualCollect: (next) => {
        forced = next;
      },
      items: [],
      run: async () => {},
    });

    expect(result).toBe("empty");
    expect(forced).toBe(true);
  });
});
