import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchWithTimeout, bindAbortRelay } from "./fetch-timeout.js";

describe("fetchWithTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves successfully if fetch completes before timeout", async () => {
    vi.useFakeTimers();
    const mockResponse = new Response("ok");
    const mockFetch = vi.fn().mockImplementation(async () => {
      return new Promise((resolve) => setTimeout(() => resolve(mockResponse), 50));
    });

    const promise = fetchWithTimeout("http://example.com", {}, 100, mockFetch);
    vi.advanceTimersByTime(50);

    await expect(promise).resolves.toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://example.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("aborts the fetch if it exceeds the timeout", async () => {
    vi.useFakeTimers();

    const mockFetch = vi.fn().mockImplementation(async (url, init) => {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => resolve(new Response("ok")), 150);

        if (init?.signal) {
          init.signal.addEventListener("abort", () => {
            clearTimeout(timeoutId);
            const err = new Error("This operation was aborted");
            err.name = "AbortError";
            reject(err);
          });

          if (init.signal.aborted) {
            clearTimeout(timeoutId);
            const err = new Error("This operation was aborted");
            err.name = "AbortError";
            reject(err);
          }
        }
      });
    });

    const promise = fetchWithTimeout("http://example.com", {}, 100, mockFetch);
    // Explicitly catch the rejection to prevent Unhandled Rejection warnings
    promise.catch(() => {});

    vi.advanceTimersByTime(100);

    await expect(promise).rejects.toThrow(/aborted/);
  });
});

describe("bindAbortRelay", () => {
  it("relays abort calls without forwarding arguments", () => {
    const controller = new AbortController();
    const abortSpy = vi.spyOn(controller, "abort");

    const relay = bindAbortRelay(controller);

    // Call relay with an event arg (as would happen if attached as listener)
    const mockEvent = new Event("someEvent");
    // @ts-expect-error - testing invalid args passed by dom
    relay(mockEvent);

    expect(abortSpy).toHaveBeenCalledTimes(1);
    expect(abortSpy).toHaveBeenCalledWith(); // no arguments!
  });
});
