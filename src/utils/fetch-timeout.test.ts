import { describe, expect, it, vi } from "vitest";
import { bindAbortRelay, fetchWithTimeout } from "./fetch-timeout.js";

describe("fetchWithTimeout", () => {
  it("resolves when fetch completes before timeout", async () => {
    const mockResponse = new Response("ok");
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await fetchWithTimeout(
      "http://example.com",
      {},
      500,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockFetch as any
    );

    expect(result).toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith("http://example.com", expect.objectContaining({
      signal: expect.any(AbortSignal)
    }));
  });

  it("aborts when fetch takes longer than timeout", async () => {
    const mockFetch = vi.fn().mockImplementation(async (url, init) => {
      return new Promise((_, reject) => {
        init.signal.addEventListener("abort", () => {
          reject(new Error("AbortError"));
        });
      });
    });

    await expect(
      fetchWithTimeout(
        "http://example.com",
        {},
        100,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockFetch as any
      )
    ).rejects.toThrow("AbortError");
  });
});

describe("bindAbortRelay", () => {
  it("calls abort on the controller when invoked", () => {
    const controller = new AbortController();
    const abortSpy = vi.spyOn(controller, "abort");

    const relay = bindAbortRelay(controller);

    // Simulate event listener call with event arg
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (relay as any)(new Event("test"));

    expect(abortSpy).toHaveBeenCalled();
    // It should NOT have passed the event argument to abort()
    expect(abortSpy).toHaveBeenCalledWith();
  });
});
