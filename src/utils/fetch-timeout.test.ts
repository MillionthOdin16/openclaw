import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fetchWithTimeout, bindAbortRelay } from "./fetch-timeout.js";

describe("bindAbortRelay", () => {
  it("should create a bound function that aborts the controller", () => {
    const controller = new AbortController();
    const abortSpy = vi.spyOn(controller, "abort");
    const relay = bindAbortRelay(controller);

    relay();
    expect(abortSpy).toHaveBeenCalled();
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

  it("should fetch successfully before timeout", async () => {
    const mockResponse = new Response("ok");
    const mockFetch = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => setTimeout(() => resolve(mockResponse), 50));
    });

    const promise = fetchWithTimeout("https://example.com", {}, 100, mockFetch);
    vi.advanceTimersByTime(50);
    const response = await promise;

    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
    expect(response).toBe(mockResponse);
  });

  it("should abort if timeout is reached", async () => {
    const mockFetch = vi.fn().mockImplementation((url, init) => {
      return new Promise((resolve, reject) => {
        const timerId = setTimeout(() => resolve(new Response("ok")), 150);
        if (init.signal) {
          init.signal.addEventListener("abort", () => {
            clearTimeout(timerId);
            reject(new Error("AbortError"));
          });
        }
      });
    });

    const promise = fetchWithTimeout("https://example.com", {}, 100, mockFetch);
    vi.advanceTimersByTime(100);

    await expect(promise).rejects.toThrow("AbortError");
  });

  it("should use a minimum timeout of 1ms if 0 or negative is provided", async () => {
    const mockFetch = vi.fn().mockImplementation((url, init) => {
      return new Promise((resolve, reject) => {
        const timerId = setTimeout(() => resolve(new Response("ok")), 10);
        if (init.signal) {
          init.signal.addEventListener("abort", () => {
            clearTimeout(timerId);
            reject(new Error("AbortError"));
          });
        }
      });
    });

    const promise = fetchWithTimeout("https://example.com", {}, 0, mockFetch);
    vi.advanceTimersByTime(1);

    await expect(promise).rejects.toThrow("AbortError");
  });
});
