import { describe, expect, it, vi, afterEach } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns the original promise if timeoutMs is <= 0", async () => {
    const originalPromise = Promise.resolve("success");
    const result = withTimeout(originalPromise, 0);
    expect(result).toBe(originalPromise);
    await expect(result).resolves.toBe("success");

    const resultNegative = withTimeout(originalPromise, -100);
    expect(resultNegative).toBe(originalPromise);
    await expect(resultNegative).resolves.toBe("success");
  });

  it("resolves the promise if it completes before the timeout", async () => {
    vi.useFakeTimers();
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("success"), 500);
    });

    const resultPromise = withTimeout(promise, 1000);
    vi.advanceTimersByTime(500);

    await expect(resultPromise).resolves.toBe("success");
  });

  it("rejects the promise if it fails before the timeout", async () => {
    vi.useFakeTimers();
    const promise = new Promise<string>((_resolve, reject) => {
      setTimeout(() => reject(new Error("original error")), 500);
    });

    const resultPromise = withTimeout(promise, 1000);

    // Catch rejection to prevent Unhandled Promise Rejection warnings in Vitest
    resultPromise.catch(() => {});

    vi.advanceTimersByTime(500);

    await expect(resultPromise).rejects.toThrow("original error");
  });

  it("rejects with a timeout error if the promise takes longer than the timeout", async () => {
    vi.useFakeTimers();
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("success"), 2000);
    });

    const resultPromise = withTimeout(promise, 1000);

    // Catch rejection to prevent Unhandled Promise Rejection warnings in Vitest
    resultPromise.catch(() => {});

    vi.advanceTimersByTime(1500);

    await expect(resultPromise).rejects.toThrow("timeout");
  });

  it("clears the timeout if the promise resolves first", async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    const promise = Promise.resolve("success");
    await withTimeout(promise, 1000);

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
  });
});
