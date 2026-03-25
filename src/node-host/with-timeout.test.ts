import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("resolves successfully when work finishes before timeout", async () => {
    const promise = withTimeout(
      async (signal) => {
        expect(signal?.aborted).toBe(false);
        return "success";
      },
      1000,
      "test",
    );

    await expect(promise).resolves.toBe("success");
  });

  it("rejects with TimeoutError when work takes longer than timeout", async () => {
    const work = async (signal: AbortSignal | undefined) => {
      return new Promise((resolve, reject) => {
        if (!signal) {
          return resolve("done");
        }
        signal.addEventListener("abort", () => reject(signal.reason));
        setTimeout(() => resolve("done"), 2000);
      });
    };

    let caughtError: Error | undefined;
    const promise = withTimeout(work, 1000, "slow-task").catch((e) => {
      caughtError = e;
    });

    // Advance time past the timeout
    await vi.advanceTimersByTimeAsync(1500);
    await promise;

    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toBe("slow-task timed out");
  });

  it("aborts the signal when timeout is reached", async () => {
    let capturedSignal: AbortSignal | undefined;

    let caughtError: Error | undefined;
    const promise = withTimeout(
      async (signal) => {
        capturedSignal = signal;
        return new Promise((_, reject) => {
          signal?.addEventListener("abort", () => reject(signal.reason));
        });
      },
      500,
      "task",
    ).catch((e) => {
      caughtError = e;
    });

    await vi.advanceTimersByTimeAsync(10);
    expect(capturedSignal?.aborted).toBe(false);

    await vi.advanceTimersByTimeAsync(500);
    await promise;

    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toBe("task timed out");
    expect(capturedSignal?.aborted).toBe(true);
    expect((capturedSignal?.reason as Error).message).toBe("task timed out");
  });

  it("uses default label if none provided", async () => {
    let caughtError: Error | undefined;
    const promise = withTimeout(
      async (signal) => new Promise((_, reject) => {
        signal?.addEventListener("abort", () => reject(signal.reason));
      }),
      100,
    ).catch((e) => { caughtError = e; });

    await vi.advanceTimersByTimeAsync(150);
    await promise;

    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toBe("request timed out");
  });

  it("propagates errors from the work function", async () => {
    const customError = new Error("Something went wrong");

    const promise = withTimeout(
      async () => {
        throw customError;
      },
      1000,
      "test",
    );

    await expect(promise).rejects.toThrow(customError);
  });

  it("ignores negative timeouts by clamping to 1ms", async () => {
    let caughtError: Error | undefined;
    const promise = withTimeout(
      async (signal) => new Promise((_, reject) => {
        signal?.addEventListener("abort", () => reject(signal.reason));
      }),
      -500,
      "test",
    ).catch((e) => { caughtError = e; });

    // It should timeout almost instantly
    await vi.advanceTimersByTimeAsync(5);
    await promise;

    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toBe("test timed out");
  });

  it("handles undefined timeout by not creating a signal or timer", async () => {
    const promise = withTimeout(
      async (signal) => {
        expect(signal).toBeUndefined();
        return "success";
      },
      undefined,
      "test",
    );

    await expect(promise).resolves.toBe("success");
  });

  it("handles Infinity timeout by not creating a signal or timer", async () => {
    const promise = withTimeout(
      async (signal) => {
        expect(signal).toBeUndefined();
        return "success";
      },
      Infinity,
      "test",
    );

    await expect(promise).resolves.toBe("success");
  });

  it("handles NaN timeout by not creating a signal or timer", async () => {
    const promise = withTimeout(
      async (signal) => {
        expect(signal).toBeUndefined();
        return "success";
      },
      NaN,
      "test",
    );

    await expect(promise).resolves.toBe("success");
  });

  it("clears the timeout when work finishes early", async () => {
    const promise = withTimeout(
      async () => "success",
      1000,
    );

    await expect(promise).resolves.toBe("success");

    // The timer is clear; advancing timers shouldn't trigger unhandled rejections
    // and there should be no active timers holding up the event loop
    expect(vi.getTimerCount()).toBe(0);
  });

  it("avoids Event memory leaks with abortListener removal", async () => {
    const mockRemove = vi.fn();
    let listenerRef: (() => void) | undefined;

    // We override the AbortController just for this test to observe internal behavior
    const OriginalAbortController = global.AbortController;
    try {
      let theSignal: AbortSignal | undefined;

      global.AbortController = class MockAbortController {
        signal = {
          aborted: false,
          addEventListener: vi.fn((event, listener) => {
            listenerRef = listener;
          }),
          removeEventListener: mockRemove,
        };
        abort = vi.fn();
      } as unknown as typeof AbortController;

      await expect(withTimeout(
        async () => "success",
        1000,
      )).resolves.toBe("success");

      expect(mockRemove).toHaveBeenCalledWith("abort", listenerRef);
    } finally {
      global.AbortController = OriginalAbortController;
    }
  });
});