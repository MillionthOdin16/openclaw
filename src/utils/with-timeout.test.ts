import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { withTimeout } from "./with-timeout.ts";

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("resolves if promise completes before timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 50));
    const resultPromise = withTimeout(promise, 100);

    vi.advanceTimersByTime(50);

    await expect(resultPromise).resolves.toBe("success");
  });

  test("rejects if promise takes longer than timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 150));
    const resultPromise = withTimeout(promise, 100);

    vi.advanceTimersByTime(100);

    await expect(resultPromise).rejects.toThrow("timeout");
  });

  test("returns original promise if timeout is 0 or less", async () => {
    const promise = Promise.resolve("success");
    await expect(withTimeout(promise, 0)).resolves.toBe("success");
    await expect(withTimeout(promise, -1)).resolves.toBe("success");
  });

  test("returns original promise if timeout is falsy", async () => {
    const promise = Promise.resolve("success");
    await expect(withTimeout(promise, undefined as unknown as number)).resolves.toBe("success");
  });

  test("clears timeout on successful resolution", async () => {
    const promise = Promise.resolve("success");
    await withTimeout(promise, 100);

    vi.advanceTimersByTime(100);
    expect(vi.getTimerCount()).toBe(0);
  });
});
