import { describe, expect, it, vi } from "vitest";
import { bindAbortRelay, fetchWithTimeout } from "./fetch-timeout.js";

describe("fetchWithTimeout", () => {
  it("resolves if fetch completes before timeout", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("ok"));
    const res = await fetchWithTimeout("http://example.com", {}, 50, mockFetch);
    expect(await res.text()).toBe("ok");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const options = mockFetch.mock.calls[0][1];
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("aborts the fetch if it times out", async () => {
    // Create a mock fetch that resolves after 50ms, but test with a 10ms timeout
    const mockFetch = vi.fn().mockImplementation((_url, init) => {
      return new Promise((resolve, reject) => {
        init.signal.addEventListener("abort", () => {
          reject(new Error("AbortError"));
        });
        setTimeout(() => resolve(new Response("ok")), 50);
      });
    });

    await expect(fetchWithTimeout("http://example.com", {}, 10, mockFetch)).rejects.toThrow(
      "AbortError",
    );
  });
});

describe("bindAbortRelay", () => {
  it("binds the abort function correctly", () => {
    const controller = new AbortController();
    const abortSpy = vi.spyOn(controller, "abort");
    const relay = bindAbortRelay(controller);

    // Call relay like it was an event listener
    relay();

    expect(abortSpy).toHaveBeenCalledTimes(1);
  });
});
