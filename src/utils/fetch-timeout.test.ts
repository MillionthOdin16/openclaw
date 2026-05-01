import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bindAbortRelay, fetchWithTimeout } from "./fetch-timeout.js";

describe("fetch-timeout utils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("bindAbortRelay", () => {
    it("should abort the controller when invoked", () => {
      const controller = new AbortController();
      const abortSpy = vi.spyOn(controller, "abort");
      const relay = bindAbortRelay(controller);

      expect(abortSpy).not.toHaveBeenCalled();
      relay();
      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe("fetchWithTimeout", () => {
    it("should resolve if fetch completes before timeout", async () => {
      const mockResponse = new Response("ok");
      const mockFetch = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(mockResponse), 100);
        });
      });

      const resultPromise = fetchWithTimeout("https://example.com", {}, 200, mockFetch as typeof fetch);

      // Advance time enough for fetch to complete but before timeout
      vi.advanceTimersByTime(150);

      const result = await resultPromise;
      expect(result).toBe(mockResponse);

      // Check that fetch was called correctly
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://example.com");
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });

    it("should abort and throw AbortError if fetch takes longer than timeout", async () => {
      // Create a mock fetch that obeys the abort signal
      const mockFetch = vi.fn().mockImplementation((_url, init) => {
        return new Promise((resolve, reject) => {
          // Listen for abort to reject the promise
          init.signal.addEventListener("abort", () => {
            const error = new Error("The operation was aborted");
            error.name = "AbortError";
            reject(error);
          });

          // Complete after a long time
          setTimeout(() => resolve(new Response("too late")), 500);
        });
      });

      const resultPromise = fetchWithTimeout("https://example.com", {}, 200, mockFetch as typeof fetch);

      // Advance time past the timeout
      vi.advanceTimersByTime(250);

      await expect(resultPromise).rejects.toThrow("The operation was aborted");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should propagate errors from fetch", async () => {
      const fetchError = new Error("Network failure");
      const mockFetch = vi.fn().mockRejectedValue(fetchError);

      const resultPromise = fetchWithTimeout("https://example.com", {}, 200, mockFetch as typeof fetch);

      await expect(resultPromise).rejects.toThrow("Network failure");
    });

    it("should ensure timeout is at least 1ms", async () => {
      const mockFetch = vi.fn().mockImplementation((_url, init) => {
        return new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () => reject(new Error("aborted")));
        });
      });

      const resultPromise = fetchWithTimeout("https://example.com", {}, 0, mockFetch as typeof fetch);

      // Even with 0 timeout, it should wait at least 1ms (set to 1ms under the hood)
      vi.advanceTimersByTime(2);

      await expect(resultPromise).rejects.toThrow("aborted");
    });
  });
});
