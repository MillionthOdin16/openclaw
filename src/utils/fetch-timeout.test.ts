import { afterEach, describe, expect, it, vi } from "vitest";
import { bindAbortRelay, fetchWithTimeout } from "./fetch-timeout.js";

describe("fetchWithTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("bindAbortRelay", () => {
    it("returns a bound function that aborts the controller", () => {
      const controller = new AbortController();
      const abortSpy = vi.spyOn(controller, "abort");
      const relay = bindAbortRelay(controller);

      relay();

      expect(abortSpy).toHaveBeenCalled();
      expect(controller.signal.aborted).toBe(true);
    });
  });

  describe("fetchWithTimeout", () => {
    it("resolves normally if fetch finishes before timeout", async () => {
      vi.useFakeTimers();

      const mockResponse = new Response("ok", { status: 200 });
      const mockFetch = vi.fn().mockImplementation((_url, _init) => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(mockResponse), 100);
        });
      });

      const fetchPromise = fetchWithTimeout("http://test.com", {}, 500, mockFetch as unknown as typeof fetch);
      vi.advanceTimersByTime(200);

      const result = await fetchPromise;
      expect(result.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith("http://test.com", expect.objectContaining({
        signal: expect.any(AbortSignal)
      }));
    });

    it("rejects normally if fetch fails before timeout", async () => {
      vi.useFakeTimers();

      const mockFetch = vi.fn().mockImplementation((_url, _init) => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error("network error")), 100);
        });
      });

      const fetchPromise = fetchWithTimeout("http://test.com", {}, 500, mockFetch as unknown as typeof fetch);
      fetchPromise.catch(() => {}); // prevent unhandled rejection

      vi.advanceTimersByTime(200);

      await expect(fetchPromise).rejects.toThrow("network error");
    });

    it("aborts the signal and throws AbortError if fetch times out", async () => {
      vi.useFakeTimers();

      const mockFetch = vi.fn().mockImplementation((_url, init) => {
        const signal = init.signal as AbortSignal;
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => resolve(new Response("late")), 1000);

          signal.addEventListener("abort", () => {
            clearTimeout(timer);
            const abortError = new Error("This operation was aborted");
            abortError.name = "AbortError";
            reject(abortError);
          });
        });
      });

      const fetchPromise = fetchWithTimeout("http://test.com", {}, 500, mockFetch as unknown as typeof fetch);
      fetchPromise.catch(() => {}); // prevent unhandled rejection

      vi.advanceTimersByTime(600);

      await expect(fetchPromise).rejects.toThrow("This operation was aborted");
      await expect(fetchPromise).rejects.toMatchObject({ name: "AbortError" });
    });

    it("enforces a minimum timeout of 1ms", async () => {
      vi.useFakeTimers();

      const mockFetch = vi.fn().mockImplementation((_url, init) => {
        const signal = init.signal as AbortSignal;
        return new Promise((resolve, reject) => {
          signal.addEventListener("abort", () => {
            const abortError = new Error("This operation was aborted");
            abortError.name = "AbortError";
            reject(abortError);
          });
        });
      });

      const fetchPromise = fetchWithTimeout("http://test.com", {}, -100, mockFetch as unknown as typeof fetch);
      fetchPromise.catch(() => {}); // prevent unhandled rejection

      // The timeout is forced to Math.max(1, timeoutMs), so it'll abort after 1ms.
      vi.advanceTimersByTime(2);

      await expect(fetchPromise).rejects.toThrow("This operation was aborted");
    });
  });
});
