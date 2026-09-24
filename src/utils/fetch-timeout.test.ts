import { describe, expect, it } from "vitest";
import { bindAbortRelay, fetchWithTimeout } from "./fetch-timeout.js";

describe("bindAbortRelay", () => {
  it("aborts the controller when called", () => {
    const controller = new AbortController();
    const relay = bindAbortRelay(controller);
    expect(controller.signal.aborted).toBe(false);
    relay();
    expect(controller.signal.aborted).toBe(true);
  });
});

describe("fetchWithTimeout", () => {
  it("calls fetchFn with abort signal and returns response", async () => {
    const mockResponse = new Response("ok");
    const fetchFn = async (url: string | Request | URL, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return mockResponse;
    };

    const result = await fetchWithTimeout("https://example.com", {}, 100, fetchFn as unknown as typeof fetch);
    expect(result).toBe(mockResponse);
  });

  it("aborts the signal if timeout is reached", async () => {
    const fetchFn = async (url: string | Request | URL, init?: RequestInit) => {
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new Error("aborted"));
        });
      });
    };

    await expect(fetchWithTimeout("https://example.com", {}, 10, fetchFn as unknown as typeof fetch)).rejects.toThrow("aborted");
  });

  it("uses default fetch if fetchFn is not provided", async () => {
    const originalFetch = global.fetch;
    const mockResponse = new Response("ok");
    global.fetch = async (_url, _init) => mockResponse;
    try {
        const result = await fetchWithTimeout("https://example.com", {}, 100);
        expect(result).toBe(mockResponse);
    } finally {
        global.fetch = originalFetch;
    }
  });

  it("sets 1ms timeout if timeoutMs <= 0", async () => {
    const mockResponse = new Response("ok");
    const fetchFn = async (_url: string | Request | URL, _init?: RequestInit) => {
      return mockResponse;
    };
    const result = await fetchWithTimeout("https://example.com", {}, -100, fetchFn as unknown as typeof fetch);
    expect(result).toBe(mockResponse);
  });
});
