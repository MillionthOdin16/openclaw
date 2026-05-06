import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWithTimeout, bindAbortRelay } from "./fetch-timeout.ts";

describe("fetch-timeout", () => {
  describe("bindAbortRelay", () => {
    it("should abort the controller when called", () => {
      const controller = new AbortController();
      const abortSpy = vi.spyOn(controller, "abort");
      const relay = bindAbortRelay(controller);

      relay();

      expect(abortSpy).toHaveBeenCalled();
      expect(controller.signal.aborted).toBe(true);
    });
  });

  describe("fetchWithTimeout", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it("should resolve if fetch completes before timeout", async () => {
      const mockResponse = new Response("ok");
      const mockFetch = vi.fn().mockImplementation(async (_url, _init) => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(mockResponse), 100);
        });
      });

      const fetchPromise = fetchWithTimeout(
        "https://example.com",
        {},
        200,
        mockFetch as typeof fetch,
      );

      vi.advanceTimersByTime(100);

      const response = await fetchPromise;
      expect(response).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com",
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it("should abort if fetch takes longer than timeout", async () => {
      const mockFetch = vi.fn().mockImplementation(async (_url, init) => {
        return new Promise((_, reject) => {
          init.signal.addEventListener("abort", () => {
            reject(new Error("The operation was aborted"));
          });
          setTimeout(() => {}, 300);
        });
      });

      const fetchPromise = fetchWithTimeout(
        "https://example.com",
        {},
        200,
        mockFetch as typeof fetch,
      );

      vi.advanceTimersByTime(200);

      await expect(fetchPromise).rejects.toThrow("The operation was aborted");
    });

    it("should clear the timeout if fetch succeeds", async () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const mockResponse = new Response("ok");
      const mockFetch = vi.fn().mockResolvedValue(mockResponse);

      await fetchWithTimeout("https://example.com", {}, 200, mockFetch as typeof fetch);

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("should clear the timeout if fetch fails", async () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network Error"));

      await expect(
        fetchWithTimeout("https://example.com", {}, 200, mockFetch as typeof fetch),
      ).rejects.toThrow("Network Error");

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
