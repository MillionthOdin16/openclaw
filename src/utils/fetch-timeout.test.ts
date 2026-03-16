import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchWithTimeout, bindAbortRelay } from "./fetch-timeout.js";

describe("bindAbortRelay", () => {
  it("binds the abort function correctly", () => {
    const controller = new AbortController();
    const abortSpy = vi.spyOn(controller, "abort");
    const relay = bindAbortRelay(controller);

    relay();
    expect(abortSpy).toHaveBeenCalledTimes(1);
  });
});

describe("fetchWithTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns the response when fetch completes before timeout", async () => {
    vi.useFakeTimers();
    const mockResponse = new Response("success");
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);

    const promise = fetchWithTimeout("https://example.com", {}, 1000, mockFetch);

    vi.advanceTimersByTime(500);

    const res = await promise;
    expect(res).toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith("https://example.com", expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  });

  it("aborts the request when the timeout is reached", async () => {
    vi.useFakeTimers();
    const mockFetch = vi.fn().mockImplementation((_url, init: RequestInit) => {
      return new Promise((resolve, reject) => {
        if (init.signal) {
          init.signal.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
          if (init.signal.aborted) {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          }
        }
        // Simulate a long-running request
        setTimeout(() => resolve(new Response("success")), 2000);
      });
    });

    const promise = fetchWithTimeout("https://example.com", {}, 1000, mockFetch);

    // Advance timers past the timeout
    vi.advanceTimersByTime(1500);

    // The promise should be rejected with an AbortError
    await expect(promise).rejects.toThrow("The operation was aborted.");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("cleans up the timeout when fetch completes successfully", async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const mockResponse = new Response("success");
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);

    await fetchWithTimeout("https://example.com", {}, 1000, mockFetch);

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
  });

  it("cleans up the timeout when fetch throws before the timeout", async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const promise = fetchWithTimeout("https://example.com", {}, 1000, mockFetch);

    promise.catch(() => {}); // Catch unhandled rejection for the test

    await expect(promise).rejects.toThrow("Network error");
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
  });
});
