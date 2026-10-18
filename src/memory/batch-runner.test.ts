import { describe, expect, it, vi } from "vitest";
import { runEmbeddingBatchGroups, buildEmbeddingBatchGroupOptions } from "./batch-runner.js";
import * as internal from "./internal.js";

vi.mock("./internal.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./internal.js")>();
  return {
    ...actual,
    runWithConcurrency: vi.fn(async (tasks: any[], concurrency: number) => {
      for (const task of tasks) {
        await task();
      }
    }),
  };
});

describe("batch-runner", () => {
  describe("runEmbeddingBatchGroups", () => {
    it("returns empty map if no requests", async () => {
      const result = await runEmbeddingBatchGroups({
        requests: [],
        maxRequests: 2,
        wait: true,
        pollIntervalMs: 100,
        timeoutMs: 1000,
        concurrency: 2,
        debugLabel: "test",
        runGroup: async () => {},
      });
      expect(result.size).toBe(0);
    });

    it("processes groups and returns byCustomId map", async () => {
      const debug = vi.fn();
      const runGroup = vi.fn(async ({ group, groupIndex, groups, byCustomId }) => {
        for (const req of group) {
          byCustomId.set("id-" + req, [req]);
        }
      });

      const result = await runEmbeddingBatchGroups({
        requests: [1, 2, 3],
        maxRequests: 2,
        wait: true,
        pollIntervalMs: 100,
        timeoutMs: 1000,
        concurrency: 2,
        debugLabel: "test-debug",
        debug,
        runGroup,
      });

      expect(debug).toHaveBeenCalledWith("test-debug", {
        requests: 3,
        groups: 2,
        wait: true,
        concurrency: 2,
        pollIntervalMs: 100,
        timeoutMs: 1000,
      });

      expect(runGroup).toHaveBeenCalledTimes(2);
      expect(result.get("id-1")).toEqual([1]);
      expect(result.get("id-3")).toEqual([3]);
    });
  });

  describe("buildEmbeddingBatchGroupOptions", () => {
    it("builds options correctly", () => {
      const debug = vi.fn();
      const options = buildEmbeddingBatchGroupOptions({
        requests: [1, 2],
        wait: true,
        pollIntervalMs: 100,
        timeoutMs: 1000,
        concurrency: 2,
        debug,
      }, {
        maxRequests: 10,
        debugLabel: "test-label",
      });

      expect(options).toEqual({
        requests: [1, 2],
        maxRequests: 10,
        wait: true,
        pollIntervalMs: 100,
        timeoutMs: 1000,
        concurrency: 2,
        debug,
        debugLabel: "test-label",
      });
    });
  });
});
