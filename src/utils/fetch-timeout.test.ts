import { describe, expect, it, vi } from "vitest";
import { bindAbortRelay, fetchWithTimeout } from "./fetch-timeout.js";

describe("bindAbortRelay", () => {
  it("binds the abort function to the controller", () => {
    const controller = new AbortController();
    const abortSpy = vi.spyOn(controller, "abort");
    const relay = bindAbortRelay(controller);

    relay();

    expect(abortSpy).toHaveBeenCalledTimes(1);
  });
});

describe("fetchWithTimeout", () => {
  it("resolves successfully if fetch completes before timeout", async () => {
    const mockResponse = new Response("ok");
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await fetchWithTimeout("https://example.com", {}, 100, mockFetch as unknown as typeof fetch);

    expect(result).toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith("https://example.com", expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  });

  it("aborts the request and throws an error if it times out", async () => {
    const mockFetch = vi.fn().mockImplementation((_url, init) => {
      return new Promise((_, reject) => {
        if (init?.signal) {
          init.signal.addEventListener("abort", () => {
            reject(new Error("AbortError"));
          });
        }
      });
    });

    await expect(fetchWithTimeout("https://example.com", {}, 10, mockFetch as unknown as typeof fetch))
      .rejects.toThrow("AbortError");
  });

  it("clears the timeout if fetch succeeds", async () => {
    vi.useFakeTimers();
    const mockResponse = new Response("ok");
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);

    const promise = fetchWithTimeout("https://example.com", {}, 1000, mockFetch as unknown as typeof fetch);

    // Fast-forward past fetch resolution but before timeout
    await Promise.resolve();
    vi.advanceTimersByTime(2000);

    await expect(promise).resolves.toBe(mockResponse);

    vi.useRealTimers();
  });
});
