import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withTimeout } from "./with-timeout.ts";

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should resolve if the promise resolves before timeout", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("success"), 100);
    });

    const resultPromise = withTimeout(promise, 200);

    vi.advanceTimersByTime(100);

    await expect(resultPromise).resolves.toBe("success");
  });

  it("should reject if the promise rejects before timeout", async () => {
    const promise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("custom error")), 100);
    });

    const resultPromise = withTimeout(promise, 200);

    vi.advanceTimersByTime(100);

    await expect(resultPromise).rejects.toThrow("custom error");
  });

  it("should reject with a timeout error if the promise takes longer than timeout", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("success"), 300);
    });

    const resultPromise = withTimeout(promise, 200);

    vi.advanceTimersByTime(200);

    await expect(resultPromise).rejects.toThrow("timeout");
  });

  it("should bypass timeout if timeoutMs is 0", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("success"), 300);
    });

    const resultPromise = withTimeout(promise, 0);

    vi.advanceTimersByTime(300);

    await expect(resultPromise).resolves.toBe("success");
  });

  it("should bypass timeout if timeoutMs is undefined", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("success"), 300);
    });

    const resultPromise = withTimeout(promise, undefined as unknown as number);

    vi.advanceTimersByTime(300);

    await expect(resultPromise).resolves.toBe("success");
  });

  it("should bypass timeout if timeoutMs is negative", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("success"), 300);
    });

    const resultPromise = withTimeout(promise, -50);

    vi.advanceTimersByTime(300);

    await expect(resultPromise).resolves.toBe("success");
  });

  it("should clear the timeout if the promise resolves", async () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("success"), 100);
    });

    const resultPromise = withTimeout(promise, 200);
    vi.advanceTimersByTime(100);

    await resultPromise;
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("should clear the timeout if the promise rejects", async () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    const promise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("fail")), 100);
    });

    const resultPromise = withTimeout(promise, 200);
    vi.advanceTimersByTime(100);

    await expect(resultPromise).rejects.toThrow("fail");
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("should handle the edge case where timer is null when finally block executes", async () => {
    const originalSetTimeout = global.setTimeout;
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    try {
      global.setTimeout = (() => null) as unknown as typeof setTimeout;
      const promise = Promise.resolve("success");

      await withTimeout(promise, 200);

      expect(clearTimeoutSpy).not.toHaveBeenCalled();
    } finally {
      global.setTimeout = originalSetTimeout;
    }
  });
});
