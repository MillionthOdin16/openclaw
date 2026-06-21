import { describe, it, expect, vi } from "vitest";
import { bindAbortRelay, fetchWithTimeout } from "./fetch-timeout.js";

describe("bindAbortRelay", () => {
  it("should return a function that aborts the controller without forwarding arguments", () => {
    const controller = new AbortController();
    const abortSpy = vi.spyOn(controller, "abort");
    const relay = bindAbortRelay(controller);

    // Call relay with an argument (simulating an Event)
    relay(new Event("test") as unknown as Event);

    // Ensure abort was called with no arguments
    expect(abortSpy).toHaveBeenCalledTimes(1);
    expect(abortSpy).toHaveBeenCalledWith();
  });
});

describe("fetchWithTimeout", () => {
  it("should successfully fetch if it completes before timeout", async () => {
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

  it("should abort the fetch if it times out", async () => {
    // Create a mock fetch that never resolves on its own, but we'll monitor the signal
    const mockFetch = vi.fn().mockImplementation((url, init) => {
      return new Promise((resolve, reject) => {
        init.signal.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        );
      });
    });

    await expect(fetchWithTimeout("http://example.com", {}, 50, mockFetch)).rejects.toThrow(
      "Aborted",
    );
  });

  it("should pass init options to fetch", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response());

    await fetchWithTimeout(
      "http://example.com",
      { method: "POST", headers: { "X-Test": "1" } },
      1000,
      mockFetch,
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "http://example.com",
      expect.objectContaining({
        method: "POST",
        headers: { "X-Test": "1" },
        signal: expect.any(AbortSignal),
      }),
    );
  });
});
