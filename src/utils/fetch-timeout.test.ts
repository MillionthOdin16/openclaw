import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { bindAbortRelay, fetchWithTimeout } from "./fetch-timeout.js";

describe("fetch-timeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("bindAbortRelay", () => {
    it("aborts the controller when called", () => {
      const controller = new AbortController();
      const relay = bindAbortRelay(controller);

      expect(controller.signal.aborted).toBe(false);
      relay();
      expect(controller.signal.aborted).toBe(true);
    });
  });

  describe("fetchWithTimeout", () => {
    it("completes successfully before timeout", async () => {
      const mockResponse = new Response("ok");
      const mockFetch = vi.fn().mockResolvedValue(mockResponse);

      const promise = fetchWithTimeout("https://example.com", {}, 1000, mockFetch);

      const result = await promise;
      expect(result).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://example.com");
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      expect(init?.signal?.aborted).toBe(false);
    });

    it("aborts the request and throws when timeout is reached", async () => {
      // Simulate a fetch that never resolves
      const mockFetch = vi.fn().mockImplementation((url, init) => {
        return new Promise((resolve, reject) => {
          if (init?.signal) {
            init.signal.addEventListener("abort", () => {
              reject(new DOMException("The operation was aborted.", "AbortError"));
            });
          }
        });
      });

      const promise = fetchWithTimeout("https://example.com", {}, 1000, mockFetch);

      // Fast forward past the timeout
      vi.advanceTimersByTime(1001);

      await expect(promise).rejects.toThrowError("The operation was aborted.");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [_, init] = mockFetch.mock.calls[0];
      expect(init?.signal?.aborted).toBe(true);
    });

    it("uses a minimum timeout of 1ms", async () => {
      const mockFetch = vi.fn().mockImplementation((url, init) => {
        return new Promise((resolve, reject) => {
          if (init?.signal) {
            init.signal.addEventListener("abort", () => {
              reject(new DOMException("The operation was aborted.", "AbortError"));
            });
          }
        });
      });

      const promise = fetchWithTimeout("https://example.com", {}, -100, mockFetch);

      // The code uses Math.max(1, timeoutMs), so it should timeout at 1ms
      vi.advanceTimersByTime(1);

      await expect(promise).rejects.toThrowError("The operation was aborted.");
    });
  });
});
