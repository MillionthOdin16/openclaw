import { describe, expect, it } from "vitest";
import { resolveBatchCompletionFromStatus, throwIfBatchTerminalFailure, resolveCompletedBatchResult } from "./batch-status.js";

describe("batch-status", () => {
  describe("resolveBatchCompletionFromStatus", () => {
    it("returns output and error file ids", () => {
      const result = resolveBatchCompletionFromStatus({
        provider: "OpenAI",
        batchId: "batch-1",
        status: { output_file_id: "out-1", error_file_id: "err-1" }
      });
      expect(result).toEqual({ outputFileId: "out-1", errorFileId: "err-1" });
    });

    it("returns only output file id if no error id", () => {
      const result = resolveBatchCompletionFromStatus({
        provider: "OpenAI",
        batchId: "batch-1",
        status: { output_file_id: "out-1" }
      });
      expect(result).toEqual({ outputFileId: "out-1", errorFileId: undefined });
    });

    it("throws if no output file id", () => {
      expect(() => resolveBatchCompletionFromStatus({
        provider: "OpenAI",
        batchId: "batch-1",
        status: {}
      })).toThrow("OpenAI batch batch-1 completed without output file");
    });
  });

  describe("throwIfBatchTerminalFailure", () => {
    it("does nothing for non-terminal states", async () => {
      await throwIfBatchTerminalFailure({
        provider: "Test",
        status: { status: "in_progress" },
        readError: async () => undefined
      });
    });

    it("throws basic error for terminal state without detail", async () => {
      await expect(throwIfBatchTerminalFailure({
        provider: "Test",
        status: { id: "b1", status: "failed" },
        readError: async () => undefined
      })).rejects.toThrow("Test batch b1 failed");
    });

    it("throws detailed error for terminal state with detail", async () => {
      await expect(throwIfBatchTerminalFailure({
        provider: "Test",
        status: { id: "b1", status: "failed", error_file_id: "err1" },
        readError: async () => "detailed reason"
      })).rejects.toThrow("Test batch b1 failed: detailed reason");
    });

    it("handles unknown batch id", async () => {
       await expect(throwIfBatchTerminalFailure({
        provider: "Test",
        status: { status: "cancelled" },
        readError: async () => undefined
      })).rejects.toThrow("Test batch <unknown> cancelled");
    });
  });

  describe("resolveCompletedBatchResult", () => {
    it("throws if wait is false and not completed", async () => {
      await expect(resolveCompletedBatchResult({
        provider: "Test",
        status: { id: "b1", status: "in_progress" },
        wait: false,
        waitForBatch: async () => ({ outputFileId: "out" })
      })).rejects.toThrow("Test batch b1 submitted; enable remote.batch.wait to await completion");
    });

    it("resolves immediately if already completed", async () => {
      const result = await resolveCompletedBatchResult({
        provider: "Test",
        status: { id: "b1", status: "completed", output_file_id: "out1" },
        wait: true,
        waitForBatch: async () => ({ outputFileId: "out-wait" })
      });
      expect(result).toEqual({ outputFileId: "out1", errorFileId: undefined });
    });

    it("waits if not completed and wait is true", async () => {
      const result = await resolveCompletedBatchResult({
        provider: "Test",
        status: { id: "b1", status: "in_progress" },
        wait: true,
        waitForBatch: async () => ({ outputFileId: "out-wait", errorFileId: "err" })
      });
      expect(result).toEqual({ outputFileId: "out-wait", errorFileId: "err" });
    });

    it("throws if wait returns no output file", async () => {
      await expect(resolveCompletedBatchResult({
        provider: "Test",
        status: { id: "b1", status: "in_progress" },
        wait: true,
        waitForBatch: async () => ({ outputFileId: "" })
      })).rejects.toThrow("Test batch b1 completed without output file");
    });
  });
});
