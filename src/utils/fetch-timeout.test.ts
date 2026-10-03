import { describe, it, expect, vi } from "vitest";
import { bindAbortRelay, fetchWithTimeout } from "./fetch-timeout.ts";

describe("bindAbortRelay", () => {
  it("should relay abort correctly without passing the event argument", () => {
    const controller = new AbortController();
    const relay = bindAbortRelay(controller);
    expect(controller.signal.aborted).toBe(false);

    // Simulate event listener passing an event argument
    relay(new Event("abort") as any);

    expect(controller.signal.aborted).toBe(true);
    // Ensure the reason is the default abort reason, not the event object
    expect(controller.signal.reason).not.toBeInstanceOf(Event);
  });
});

describe("fetchWithTimeout", () => {
  it("should return the response if fetch completes before timeout", async () => {
    const mockResponse = new Response("ok");
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);

    const response = await fetchWithTimeout("http://example.com", {}, 1000, mockFetch);

    expect(response).toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should abort the fetch if it takes longer than timeout", async () => {
    const mockFetch = vi.fn().mockImplementation((url, init) => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve(new Response("ok"));
        }, 100);

        init.signal.addEventListener("abort", () => {
          clearTimeout(timeout);
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });

    await expect(fetchWithTimeout("http://example.com", {}, 10, mockFetch)).rejects.toThrow(/Abort/);
  });
});
