import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { bindAbortRelay, fetchWithTimeout } from "./fetch-timeout.ts";

describe("fetch-timeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("bindAbortRelay", () => {
    it("should return a function that aborts the controller", () => {
      const controller = new AbortController();
      const abortSpy = vi.spyOn(controller, "abort");
      const relay = bindAbortRelay(controller);

      expect(abortSpy).not.toHaveBeenCalled();
      relay();
      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe("fetchWithTimeout", () => {
    it("should fetch successfully if it completes before the timeout", async () => {
      const mockResponse = new Response("ok", { status: 200 });
      const mockFetch = vi.fn().mockResolvedValue(mockResponse);

      const fetchPromise = fetchWithTimeout("https://example.com", {}, 1000, mockFetch as typeof fetch);

      const response = await fetchPromise;
      expect(response).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://example.com");
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    });

    it("should throw an error if the request takes longer than the timeout", async () => {
      // Mock fetch to never resolve naturally
      const mockFetch = vi.fn().mockImplementation((url, init) => {
        return new Promise((resolve, reject) => {
          init.signal.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        });
      });

      const fetchPromise = fetchWithTimeout("https://example.com", {}, 1000, mockFetch as typeof fetch);

      // Fast-forward time so the timeout hits
      vi.advanceTimersByTime(1001);

      await expect(fetchPromise).rejects.toThrow("The operation was aborted.");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
