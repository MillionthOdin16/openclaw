import { afterEach, describe, expect, it, vi } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves the promise if it completes before the timeout", async () => {
    vi.useFakeTimers();
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("done"), 100);
    });

    const resultPromise = withTimeout(promise, 500);
    vi.advanceTimersByTime(200);

    await expect(resultPromise).resolves.toBe("done");
  });

  it("rejects the promise if it fails before the timeout", async () => {
    vi.useFakeTimers();
    const promise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("failed")), 100);
    });

    const resultPromise = withTimeout(promise, 500);
    resultPromise.catch(() => {}); // Prevent unhandled rejection warning
    vi.advanceTimersByTime(200);

    await expect(resultPromise).rejects.toThrow("failed");
  });

  it("rejects with a timeout error if the promise takes too long", async () => {
    vi.useFakeTimers();
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("done"), 1000);
    });

    const resultPromise = withTimeout(promise, 500);
    resultPromise.catch(() => {}); // Prevent unhandled rejection warning
    vi.advanceTimersByTime(600);

    await expect(resultPromise).rejects.toThrow("timeout");
  });

  it("returns original promise without timeout if timeoutMs is 0", async () => {
    const promise = Promise.resolve("done");
    const result = await withTimeout(promise, 0);
    expect(result).toBe("done");
  });

  it("returns original promise without timeout if timeoutMs is negative", async () => {
    const promise = Promise.resolve("done");
    const result = await withTimeout(promise, -100);
    expect(result).toBe("done");
  });

  it("cleans up the timeout correctly upon success", async () => {
    vi.useFakeTimers();
    const promise = Promise.resolve("fast");
    await withTimeout(promise, 500);

    // If timeout was not cleared, advancing timers might cause a timeout error
    // in the background, though since we already resolved the race it won't affect the returned promise.
    // Vitest fake timers ensure there are no pending timers if it's cleared.
    expect(vi.getTimerCount()).toBe(0);
  });
});
