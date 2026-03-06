import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fetchWithTimeout, bindAbortRelay } from "./fetch-timeout.js";

describe("fetchWithTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves fetch before timeout", async () => {
    const mockResponse = new Response("ok", { status: 200 });
    const fetchFn = vi.fn().mockImplementation(async (url, init) => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 50));
      return mockResponse;
    });

    const promise = fetchWithTimeout("http://example.com", {}, 100, fetchFn);

    // Fast-forward past network delay but before timeout
    await vi.advanceTimersByTimeAsync(60);

    const result = await promise;
    expect(result).toBe(mockResponse);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn.mock.calls[0][0]).toBe("http://example.com");
    // Ensure signal is passed
    expect(fetchFn.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("aborts fetch on timeout", async () => {
    let passedSignal: AbortSignal | undefined;
    const fetchFn = vi.fn().mockImplementation(async (url, init) => {
      passedSignal = init.signal;
      // Simulate long network request
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 200);
        passedSignal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new Error("The operation was aborted."));
        });
      });
      return new Response("ok");
    });

    const promise = fetchWithTimeout("http://example.com", {}, 100, fetchFn);

    const promiseRejects = expect(promise).rejects.toThrowError("The operation was aborted.");

    // Fast-forward past timeout
    await vi.advanceTimersByTimeAsync(110);

    await promiseRejects;
    expect(passedSignal?.aborted).toBe(true);
  });

  it("passes minimum timeout of 1ms", async () => {
    const fetchFn = vi.fn().mockImplementation(async () => new Response("ok"));
    const promise = fetchWithTimeout("http://example.com", {}, -10, fetchFn);

    // Timer should be set to 1ms under the hood.
    await vi.advanceTimersByTimeAsync(2);
    const result = await promise;
    expect(result.status).toBe(200);
  });
});

describe("bindAbortRelay", () => {
  it("relays abort call to the bound controller", () => {
    const controller = new AbortController();
    const relay = bindAbortRelay(controller);

    expect(controller.signal.aborted).toBe(false);
    relay();
    expect(controller.signal.aborted).toBe(true);
  });
});