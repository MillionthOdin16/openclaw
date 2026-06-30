import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWithTimeout, bindAbortRelay } from "./fetch-timeout.ts";

describe("fetchWithTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("resolves if fetch completes before timeout", async () => {
    const mockResponse = new Response("ok");
    const mockFetch = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => setTimeout(() => resolve(mockResponse), 50));
    });

    const promise = fetchWithTimeout("https://example.com", {}, 100, mockFetch);

    vi.advanceTimersByTime(50);

    const result = await promise;
    expect(result).toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  test("aborts if fetch takes longer than timeout", async () => {
    const mockFetch = vi.fn().mockImplementation((_url, init) => {
      return new Promise((resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(new Error("AbortError")));
        setTimeout(() => resolve(new Response("ok")), 150);
      });
    });

    const promise = fetchWithTimeout("https://example.com", {}, 100, mockFetch);

    vi.advanceTimersByTime(100);

    await expect(promise).rejects.toThrow("AbortError");
  });

  test("minimum timeout is 1ms", async () => {
    const mockFetch = vi.fn().mockImplementation((_url, init) => {
      return new Promise((resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(new Error("AbortError")));
        setTimeout(() => resolve(new Response("ok")), 50);
      });
    });

    const promise = fetchWithTimeout("https://example.com", {}, 0, mockFetch);

    vi.advanceTimersByTime(1);

    await expect(promise).rejects.toThrow("AbortError");
  });
});

describe("bindAbortRelay", () => {
  test("relays abort", () => {
    const controller = new AbortController();
    const abortSpy = vi.spyOn(controller, "abort");

    const relay = bindAbortRelay(controller);
    relay();

    expect(abortSpy).toHaveBeenCalled();
  });
});
