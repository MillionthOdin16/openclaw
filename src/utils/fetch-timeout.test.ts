import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { bindAbortRelay, fetchWithTimeout } from "./fetch-timeout.ts";

describe("fetchWithTimeout", () => {
  let mockFetch: Mock;

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock fetch that properly supports AbortSignal rejection handling
    mockFetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      return new Promise((resolve, reject) => {
        const signal = init?.signal;

        if (signal?.aborted) {
          return reject(signal.reason || new Error("AbortError"));
        }

        const onAbort = () => {
          reject(signal?.reason || new Error("AbortError"));
          signal?.removeEventListener("abort", onAbort);
        };

        if (signal) {
          signal.addEventListener("abort", onAbort);
        }

        // Simulate network delay using setTimeout so we can manipulate it with fake timers
        const timerId = setTimeout(() => {
          if (signal) {
            signal.removeEventListener("abort", onAbort);
          }
          resolve(new Response("ok"));
        }, 100);

        // If aborted during delay, the abort listener will trigger rejection
        if (signal) {
          signal.addEventListener("abort", () => clearTimeout(timerId));
        }
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should complete successfully if fetch responds before timeout", async () => {
    const fetchPromise = fetchWithTimeout("http://example.com", {}, 200, mockFetch);

    // Advance timers by less than the timeout but enough to trigger the fetch resolve
    vi.advanceTimersByTime(100);

    const response = await fetchPromise;
    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe("ok");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("http://example.com", expect.any(Object));
  });

  it("should abort the request and throw AbortError on timeout", async () => {
    const fetchPromise = fetchWithTimeout("http://example.com", {}, 50, mockFetch);

    // Advance timers by the timeout duration (which is less than fetch duration 100)
    vi.advanceTimersByTime(50);

    await expect(fetchPromise).rejects.toThrow(/abort|AbortError/i);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("bindAbortRelay", () => {
  it("should abort the controller when called", () => {
    const controller = new AbortController();
    const abortSpy = vi.spyOn(controller, "abort");
    const boundRelay = bindAbortRelay(controller);

    boundRelay();

    expect(abortSpy).toHaveBeenCalledTimes(1);
    expect(abortSpy).toHaveBeenCalledWith(); // Called with no arguments!
    expect(controller.signal.aborted).toBe(true);
  });

  it("should not forward the event argument as abort reason", () => {
    const controller = new AbortController();
    const boundRelay = bindAbortRelay(controller);

    // Simulate an event listener being called with an Event object
    const mockEvent = new Event("click");
    // @ts-expect-error simulating event listener call with arguments
    boundRelay(mockEvent);

    expect(controller.signal.aborted).toBe(true);
    // The reason should be the default undefined/AbortError, not the Event object
    expect(controller.signal.reason).not.toBe(mockEvent);
  });
});
