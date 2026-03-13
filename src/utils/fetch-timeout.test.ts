import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchWithTimeout, bindAbortRelay } from "./fetch-timeout.js";

describe("fetchWithTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves when the fetch finishes before the timeout", async () => {
    vi.useFakeTimers();

    const mockResponse = new Response("success");
    const mockFetch = vi
      .fn()
      .mockImplementation(async (_url: string | URL | Request, _init?: RequestInit) => {
        return new Promise<Response>((resolve) => {
          setTimeout(() => resolve(mockResponse), 100);
        });
      });

    const fetchPromise = fetchWithTimeout("https://example.com", {}, 200, mockFetch);

    vi.advanceTimersByTime(100);
    const result = await fetchPromise;
    expect(result).toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe("https://example.com");
  });

  it("rejects with AbortError when the fetch times out", async () => {
    vi.useFakeTimers();

    const mockFetch = vi
      .fn()
      .mockImplementation(async (_url: string | URL | Request, init?: RequestInit) => {
        return new Promise<Response>((resolve, reject) => {
          if (init?.signal) {
            init.signal.addEventListener("abort", () => {
              const err = new Error("This operation was aborted");
              err.name = "AbortError";
              reject(err);
            });
            if (init.signal.aborted) {
              const err = new Error("This operation was aborted");
              err.name = "AbortError";
              reject(err);
            }
          }
          setTimeout(() => resolve(new Response("success")), 200);
        });
      });

    const fetchPromise = fetchWithTimeout("https://example.com", {}, 100, mockFetch);

    // Catch rejection to avoid unhandled promise rejection warnings
    fetchPromise.catch(() => {});

    vi.advanceTimersByTime(100);
    await expect(fetchPromise).rejects.toThrow("This operation was aborted");
  });

  it("sets minimum timeout to 1ms", async () => {
    vi.useFakeTimers();

    const mockFetch = vi
      .fn()
      .mockImplementation(async (_url: string | URL | Request, init?: RequestInit) => {
        return new Promise<Response>((resolve, reject) => {
          if (init?.signal) {
            init.signal.addEventListener("abort", () => {
              const err = new Error("This operation was aborted");
              err.name = "AbortError";
              reject(err);
            });
            if (init.signal.aborted) {
              const err = new Error("This operation was aborted");
              err.name = "AbortError";
              reject(err);
            }
          }
          setTimeout(() => resolve(new Response("success")), 200);
        });
      });

    const fetchPromise = fetchWithTimeout("https://example.com", {}, -50, mockFetch);

    fetchPromise.catch(() => {});

    vi.advanceTimersByTime(1);
    await expect(fetchPromise).rejects.toThrow("This operation was aborted");
  });
});

describe("bindAbortRelay", () => {
  it("relays the abort signal correctly", () => {
    const controller = new AbortController();
    const abortSpy = vi.spyOn(controller, "abort");
    const relayFn = bindAbortRelay(controller);

    expect(abortSpy).not.toHaveBeenCalled();
    relayFn();
    expect(abortSpy).toHaveBeenCalledTimes(1);
  });
});
