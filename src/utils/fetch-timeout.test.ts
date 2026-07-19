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
    it("should bind abort to the controller", () => {
      const controller = new AbortController();
      const abortSpy = vi.spyOn(controller, "abort");
      const relay = bindAbortRelay(controller);

      relay();
      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe("fetchWithTimeout", () => {
    it("should call fetchFn with url and options including a signal", async () => {
      const fakeResponse = new Response("ok");
      const mockFetch = vi.fn().mockResolvedValue(fakeResponse) as unknown as typeof fetch;

      const promise = fetchWithTimeout("http://example.com", { method: "POST" }, 1000, mockFetch);
      vi.advanceTimersByTime(10);

      const res = await promise;
      expect(res).toBe(fakeResponse);

      expect(mockFetch).toHaveBeenCalledWith("http://example.com", expect.objectContaining({
        method: "POST",
        signal: expect.any(AbortSignal),
      }));
    });

    it("should abort if timeout is reached before fetch resolves", async () => {
      const mockFetch = vi.fn().mockImplementation((url, init) => {
        return new Promise((resolve, reject) => {
          init.signal.addEventListener("abort", () => {
            reject(new Error("AbortError"));
          });
        });
      }) as unknown as typeof fetch;

      const promise = fetchWithTimeout("http://example.com", {}, 1000, mockFetch);
      vi.advanceTimersByTime(1000);

      await expect(promise).rejects.toThrow("AbortError");
    });
  });
});
