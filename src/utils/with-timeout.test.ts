import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves the promise before timeout", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("success"), 50);
    });

    const timeoutPromise = withTimeout(promise, 100);
    await vi.advanceTimersByTimeAsync(60);

    const result = await timeoutPromise;
    expect(result).toBe("success");
  });

  it("rejects the promise before timeout", async () => {
    const promise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("custom error")), 50);
    });

    const timeoutPromise = withTimeout(promise, 100);
    const promiseRejects = expect(timeoutPromise).rejects.toThrowError("custom error");
    await vi.advanceTimersByTimeAsync(60);

    await promiseRejects;
  });

  it("rejects with 'timeout' error when timeout is reached", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("late success"), 200);
    });

    const timeoutPromise = withTimeout(promise, 100);
    const promiseRejects = expect(timeoutPromise).rejects.toThrowError("timeout");
    await vi.advanceTimersByTimeAsync(110);

    await promiseRejects;
  });

  it("returns original promise when timeout is 0 or negative or falsy", async () => {
    const promise = Promise.resolve("instant success");

    expect(await withTimeout(promise, 0)).toBe("instant success");
    expect(await withTimeout(promise, -10)).toBe("instant success");
    expect(await withTimeout(promise, undefined as any)).toBe("instant success");
  });

  it("handles final cleanup when timer is null", async () => {
    // Override setTimeout to return null temporarily
    const originalSetTimeout = globalThis.setTimeout;
    try {
      (globalThis.setTimeout as any) = () => null;

      const promise = Promise.resolve("instant success");
      const timeoutPromise = withTimeout(promise, 100);

      const result = await timeoutPromise;
      expect(result).toBe("instant success");
    } finally {
      globalThis.setTimeout = originalSetTimeout;
    }
  });

  it("clears timeout on successful resolution", async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const promise = new Promise((resolve) => {
        setTimeout(() => resolve("success"), 5);
    });
    const withProm = withTimeout(promise, 100);
    await vi.advanceTimersByTimeAsync(10);
    await withProm;

    // Timeout clearing happens in `.finally`, we should wait for a microtask tick
    await Promise.resolve();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("clears timeout on rejection", async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const promise = Promise.reject(new Error("early failure"));
    // ignore unhandled rejection by catch
    promise.catch(() => {});

    await expect(withTimeout(promise, 100)).rejects.toThrow("early failure");

    // Timeout clearing happens in `.finally`
    await Promise.resolve();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("handles when promise rejects while timed out (branch 10)", async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
      const promise = new Promise<string>((resolve) => {
          setTimeout(() => resolve("late success"), 200);
      });

      const timeoutPromise = withTimeout(promise, 100);
      const promiseRejects = expect(timeoutPromise).rejects.toThrowError("timeout");

      await vi.advanceTimersByTimeAsync(110);

      await promiseRejects;

      // Ensure timer is checked and cleared when racing promises resolve
      await Promise.resolve();
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
  });
});