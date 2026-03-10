import { describe, it, expect, vi, afterEach } from "vitest";
import { bindAbortRelay, fetchWithTimeout } from "./fetch-timeout";

describe("fetch-timeout utils", () => {
  describe("bindAbortRelay", () => {
    it("should return a function that aborts the controller", () => {
      const controller = new AbortController();
      const abortSpy = vi.spyOn(controller, "abort");
      const relay = bindAbortRelay(controller);

      relay();
      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe("fetchWithTimeout", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("should resolve if fetch succeeds before timeout", async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response("success"));
      const promise = fetchWithTimeout("http://example.com", {}, 1000, mockFetch);

      const response = await promise;
      expect(await response.text()).toBe("success");
      expect(mockFetch).toHaveBeenCalledWith("http://example.com", expect.any(Object));
    });

    it("should reject if fetch times out", async () => {
      vi.useFakeTimers();

      // We need a fetch that just waits indefinitely
      const mockFetch = vi.fn().mockImplementation((_url, init) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        });
      });

      const promise = fetchWithTimeout("http://example.com", {}, 1000, mockFetch);

      vi.advanceTimersByTime(1001); // Trigger timeout

      await expect(promise).rejects.toThrow("The operation was aborted.");
    });

    it("should handle timeoutMs less than 1 by defaulting to 1ms", async () => {
      vi.useFakeTimers();

      const mockFetch = vi.fn().mockImplementation((_url, init) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        });
      });

      const promise = fetchWithTimeout("http://example.com", {}, 0, mockFetch);

      vi.advanceTimersByTime(2); // Should have triggered

      await expect(promise).rejects.toThrow("The operation was aborted.");
    });
  });
});
