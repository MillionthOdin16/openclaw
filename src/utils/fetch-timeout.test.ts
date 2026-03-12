import { describe, it, expect, vi, afterEach } from "vitest";
import { bindAbortRelay, fetchWithTimeout } from "./fetch-timeout.js";

describe("fetch-timeout", () => {
  describe("bindAbortRelay", () => {
    it("should abort the controller without passing the event argument", () => {
      const controller = new AbortController();
      const abortSpy = vi.spyOn(controller, "abort");
      const relay = bindAbortRelay(controller);

      // Simulate an event listener passing an event argument
      const mockEvent = new Event("abort");
      // We have to cast to unknown to simulate calling it with an argument,
      // since the signature is `() => void`.
      (relay as unknown as (event: Event) => void)(mockEvent);

      expect(abortSpy).toHaveBeenCalledTimes(1);
      // The crucial part: it should be called with NO arguments,
      // not with the mockEvent.
      expect(abortSpy).toHaveBeenCalledWith();
    });
  });

  describe("fetchWithTimeout", () => {
    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it("should resolve successfully if fetch completes before timeout", async () => {
      vi.useFakeTimers();

      const mockResponse = new Response("ok", { status: 200 });
      const mockFetch = vi.fn().mockImplementation(async (_url: string, _init: RequestInit) => {
        return mockResponse;
      });

      const fetchPromise = fetchWithTimeout("https://example.com", {}, 1000, mockFetch as unknown as typeof fetch);

      // Advance time by a small amount, less than timeout
      vi.advanceTimersByTime(500);

      const response = await fetchPromise;

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith("https://example.com", expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
      expect(response).toBe(mockResponse);
    });

    it("should abort the fetch if it takes longer than the timeout", async () => {
      vi.useFakeTimers();

      let capturedSignal: AbortSignal | undefined;
      const mockFetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
        const signal = init.signal as AbortSignal;
        capturedSignal = signal;

        return new Promise((resolve, reject) => {
          if (signal?.aborted) {
            return reject(new Error("AbortError"));
          }
          signal?.addEventListener("abort", () => {
            reject(new Error("AbortError"));
          });

          setTimeout(() => resolve(new Response("ok")), 5000);
        });
      });

      const fetchPromise = fetchWithTimeout("https://example.com", {}, 1000, mockFetch as unknown as typeof fetch);

      // We must explicitly catch the rejection to prevent unhandled promise rejections
      const catchMock = vi.fn();
      fetchPromise.catch(catchMock);

      // Advance time past the timeout
      vi.advanceTimersByTime(1500);

      // Wait for any microtasks to clear and the promise to reject
      await vi.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(capturedSignal).toBeDefined();
      expect(capturedSignal?.aborted).toBe(true);
      expect(catchMock).toHaveBeenCalledTimes(1);
    });

    it("should handle the case where fetch throws an error immediately", async () => {
       vi.useFakeTimers();
       const mockError = new Error("Network error");
       const mockFetch = vi.fn().mockRejectedValue(mockError);

       const fetchPromise = fetchWithTimeout("https://example.com", {}, 1000, mockFetch as unknown as typeof fetch);

       await expect(fetchPromise).rejects.toThrow("Network error");
    });
  });
});
