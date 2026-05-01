import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return the promise result if it resolves before the timeout", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("success"), 100);
    });

    const resultPromise = withTimeout(promise, 200);
    vi.advanceTimersByTime(150);

    await expect(resultPromise).resolves.toBe("success");
  });

  it("should throw a timeout error if the promise takes longer than the timeout", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("success"), 200);
    });

    const resultPromise = withTimeout(promise, 100);
    vi.advanceTimersByTime(150);

    await expect(resultPromise).rejects.toThrow("timeout");
  });

  it("should propagate original errors from the promise", async () => {
    const promise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("original error")), 100);
    });

    const resultPromise = withTimeout(promise, 200);
    vi.advanceTimersByTime(150);

    await expect(resultPromise).rejects.toThrow("original error");
  });

  it("should just return the promise directly if timeoutMs is 0 or negative or falsy", async () => {
    const promise = Promise.resolve("success");

    await expect(withTimeout(promise, 0)).resolves.toBe("success");
    await expect(withTimeout(promise, -100)).resolves.toBe("success");
    await expect(withTimeout(promise, undefined as any)).resolves.toBe("success");

    // Test that no timers are actually created and it resolves even if taking long
    const slowPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("delayed success"), 1000);
    });

    const resultPromise = withTimeout(slowPromise, 0);
    vi.advanceTimersByTime(2000);

    await expect(resultPromise).resolves.toBe("delayed success");
  });
});
