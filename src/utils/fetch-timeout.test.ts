import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fetchWithTimeout, bindAbortRelay } from "./fetch-timeout";

describe("fetchWithTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("clears timeout on success", async () => {
    const mockResponse = new Response("ok");
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);

    const spyClearTimeout = vi.spyOn(global, "clearTimeout");
    await fetchWithTimeout("https://example.com", {}, 1000, mockFetch);

    expect(spyClearTimeout).toHaveBeenCalled();
  });

  it("completes fetch within timeout", async () => {
    const mockResponse = new Response("ok");
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);

    const fetchPromise = fetchWithTimeout("https://example.com", {}, 1000, mockFetch);

    // Fast-forward 500ms
    vi.advanceTimersByTime(500);

    const result = await fetchPromise;

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
    expect(result).toBe(mockResponse);
  });

  it("aborts fetch after timeout", async () => {
    // Create an actual AbortError similar to what fetch throws
    const mockFetch = vi.fn().mockImplementation((url, init) => {
      return new Promise((resolve, reject) => {
        init.signal.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      });
    });

    const fetchPromise = fetchWithTimeout("https://example.com", {}, 1000, mockFetch);

    // Fast-forward 1500ms (past the 1000ms timeout)
    vi.advanceTimersByTime(1500);

    await expect(fetchPromise).rejects.toThrowError("The operation was aborted.");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("handles minimum timeout of 1ms", async () => {
    const mockFetch = vi.fn().mockImplementation((url, init) => {
      return new Promise((resolve, reject) => {
        init.signal.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      });
    });

    const fetchPromise = fetchWithTimeout("https://example.com", {}, -100, mockFetch); // negative timeout

    // Fast-forward 5ms
    vi.advanceTimersByTime(5);

    await expect(fetchPromise).rejects.toThrowError("The operation was aborted.");
  });

  it("re-throws errors from fetch", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network Error"));
    const fetchPromise = fetchWithTimeout("https://example.com", {}, 1000, mockFetch);

    await expect(fetchPromise).rejects.toThrowError("Network Error");
  });
});

describe("bindAbortRelay", () => {
  it("relays abort signal", () => {
    const controller = new AbortController();
    const relay = bindAbortRelay(controller);

    expect(controller.signal.aborted).toBe(false);
    relay();
    expect(controller.signal.aborted).toBe(true);
  });
});
