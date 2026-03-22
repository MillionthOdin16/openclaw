import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bindAbortRelay, fetchWithTimeout } from "./fetch-timeout.js";

describe("fetch-timeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("bindAbortRelay", () => {
    it("should bind the abort method correctly", () => {
      const controller = new AbortController();
      const abortSpy = vi.spyOn(controller, "abort");
      const relay = bindAbortRelay(controller);

      relay();

      expect(abortSpy).toHaveBeenCalledOnce();
      // Verify no event argument was passed (which could be mistakenly captured)
      expect(abortSpy).toHaveBeenCalledWith();
    });
  });

  describe("fetchWithTimeout", () => {
    it("should successfully fetch within the timeout", async () => {
      const mockResponse = new Response("ok");
      const fetchMock = vi.fn().mockResolvedValue(mockResponse);

      const fetchPromise = fetchWithTimeout("http://example.com", {}, 1000, fetchMock);

      // Advance time but not enough to trigger timeout
      vi.advanceTimersByTime(500);

      const response = await fetchPromise;

      expect(response).toBe(mockResponse);
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock.mock.calls[0][0]).toBe("http://example.com");
      // Assert that signal is passed
      expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
      expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
    });

    it("should abort the fetch if timeout is reached", async () => {
      let passedSignal: AbortSignal | undefined;
      const fetchMock = vi.fn().mockImplementation((_url, init) => {
        passedSignal = init.signal;
        return new Promise((resolve, reject) => {
          init.signal.addEventListener("abort", () => {
            reject(new Error("AbortError"));
          });
        });
      });

      const fetchPromise = fetchWithTimeout("http://example.com", {}, 1000, fetchMock);

      // Advance time to trigger timeout
      vi.advanceTimersByTime(1001);

      await expect(fetchPromise).rejects.toThrow("AbortError");

      expect(passedSignal?.aborted).toBe(true);
    });

    it("should ensure a minimum timeout of 1ms", async () => {
      let passedSignal: AbortSignal | undefined;
      const fetchMock = vi.fn().mockImplementation((_url, init) => {
        passedSignal = init.signal;
        return new Promise((resolve, reject) => {
          init.signal.addEventListener("abort", () => {
            reject(new Error("AbortError"));
          });
        });
      });

      // Pass 0, which should be normalized to 1
      const fetchPromise = fetchWithTimeout("http://example.com", {}, 0, fetchMock);

      vi.advanceTimersByTime(1);

      await expect(fetchPromise).rejects.toThrow("AbortError");
      expect(passedSignal?.aborted).toBe(true);
    });

    it("should pass init parameters to fetch", async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response("ok"));

      await fetchWithTimeout("http://example.com", { method: "POST", headers: { "X-Test": "1" } }, 1000, fetchMock);

      expect(fetchMock).toHaveBeenCalledOnce();
      const passedInit = fetchMock.mock.calls[0][1];
      expect(passedInit.method).toBe("POST");
      expect(passedInit.headers).toEqual({ "X-Test": "1" });
      expect(passedInit.signal).toBeInstanceOf(AbortSignal);
    });
  });
});
