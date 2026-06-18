import { describe, expect, it, vi } from "vitest";
import { bindAbortRelay, fetchWithTimeout } from "./fetch-timeout.js";

describe("bindAbortRelay", () => {
  it("should return a function that aborts the controller without event arguments", () => {
    const controller = new AbortController();
    const abortSpy = vi.spyOn(controller, "abort");
    const relay = bindAbortRelay(controller);

    // Simulate an event callback that passes an event argument
    relay(new Event("test") as unknown as Event);

    expect(abortSpy).toHaveBeenCalledTimes(1);
    expect(abortSpy).toHaveBeenCalledWith(); // Ensure no arguments were passed
  });
});

describe("fetchWithTimeout", () => {
  it("should resolve with the fetch response if it finishes before timeout", async () => {
    const mockResponse = new Response("ok");
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await fetchWithTimeout("http://example.com", {}, 1000, mockFetch);

    expect(result).toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://example.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("should abort and throw an AbortError if the request times out", async () => {
    const mockFetch = vi.fn().mockImplementation((_url, init) => {
      return new Promise((_, reject) => {
        init.signal.addEventListener("abort", () => {
          reject(new Error("AbortError")); // Standard fetch abort error
        });
      });
    });

    await expect(fetchWithTimeout("http://example.com", {}, 10, mockFetch)).rejects.toThrow(
      "AbortError",
    );
  });

  it("should clear the timeout if the fetch resolves quickly", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("ok"));
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    await fetchWithTimeout("http://example.com", {}, 1000, mockFetch);

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
  });
});
