import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withTimeout } from "./with-timeout.ts";

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should bypass timeout if timeoutMs is 0 or less", async () => {
    // A promise that never resolves naturally
    const neverResolve = new Promise<string>(() => {});

    // This would normally timeout, but with timeoutMs = 0, it should bypass the timeout logic
    const promise = withTimeout(neverResolve, 0);

    // It should just return the original promise, which never resolves.
    expect(promise).toBe(neverResolve);

    const promiseNegative = withTimeout(neverResolve, -100);
    expect(promiseNegative).toBe(neverResolve);
  });

  it("should resolve successfully before the timeout", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("success"), 50);
    });

    const timeoutPromise = withTimeout(promise, 100);

    vi.advanceTimersByTime(50);

    await expect(timeoutPromise).resolves.toBe("success");
  });

  it("should reject with error if the original promise rejects before timeout", async () => {
    const promise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("original error")), 50);
    });

    const timeoutPromise = withTimeout(promise, 100);

    vi.advanceTimersByTime(50);

    await expect(timeoutPromise).rejects.toThrow("original error");
  });

  it("should reject with timeout error if promise takes too long", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("late success"), 200);
    });

    const timeoutPromise = withTimeout(promise, 100);

    vi.advanceTimersByTime(100);

    await expect(timeoutPromise).rejects.toThrow("timeout");
  });

  it("should bypass timeout if timeoutMs is undefined or falsy", async () => {
    const neverResolve = new Promise<string>(() => {});

    // @ts-expect-error testing invalid arguments
    const promiseUndefined = withTimeout(neverResolve, undefined);
    expect(promiseUndefined).toBe(neverResolve);

    // @ts-expect-error testing invalid arguments
    const promiseNull = withTimeout(neverResolve, null);
    expect(promiseNull).toBe(neverResolve);
  });

  it("should gracefully handle if timer is somehow null on cleanup", async () => {
    // This is technically an unreachable edge case in V8 without monkeypatching setTimeout,
    // but we can simulate the .finally cleanup block execution where timer might be manipulated

    const promise = new Promise<string>((resolve) => resolve("quick"));

    // We mock setTimeout to return null (or undefined)
    const originalSetTimeout = global.setTimeout;
    // @ts-expect-error testing internal branch
    global.setTimeout = () => null;

    try {
      const timeoutPromise = withTimeout(promise, 100);
      await expect(timeoutPromise).resolves.toBe("quick");
    } finally {
      global.setTimeout = originalSetTimeout;
    }
  });
});
