import { afterEach, describe, expect, it, vi } from "vitest";
import { bindAbortRelay, fetchWithTimeout } from "./fetch-timeout.js";

describe("bindAbortRelay", () => {
  it("binds the abort relay to the controller", () => {
    const controller = new AbortController();
    const abortSpy = vi.spyOn(controller, "abort");
    const relay = bindAbortRelay(controller);

    relay();

    expect(abortSpy).toHaveBeenCalledTimes(1);
    expect(controller.signal.aborted).toBe(true);
  });
});

describe("fetchWithTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("completes successfully within the timeout", async () => {
    vi.useFakeTimers();

    const mockResponse = new Response("ok", { status: 200 });
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);

    const promise = fetchWithTimeout("https://example.com", {}, 1000, mockFetch as unknown as typeof fetch);

    // Fast-forward time less than timeout
    await vi.advanceTimersByTimeAsync(500);

    const response = await promise;

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(response).toBe(mockResponse);
  });

  it("aborts the request upon timeout", async () => {
    vi.useFakeTimers();

    const mockFetch = vi.fn().mockImplementation(
      (_url: string, init: RequestInit) => {
        return new Promise<Response>((resolve, reject) => {
          if (init.signal) {
            init.signal.addEventListener("abort", () => {
              const err = new Error("AbortError");
              err.name = "AbortError";
              reject(err);
            });
          }
          // Request takes 2000ms
          setTimeout(() => {
            resolve(new Response("ok"));
          }, 2000);
        });
      }
    );

    const promise = fetchWithTimeout("https://example.com", {}, 1000, mockFetch as unknown as typeof fetch);

    // Capture the rejection to avoid Unhandled Rejection warning
    promise.catch(() => {});

    // Fast-forward time to trigger timeout
    await vi.advanceTimersByTimeAsync(1500);

    await expect(promise).rejects.toThrow("AbortError");
  });

  it("clears the timeout when fetch completes successfully", async () => {
    vi.useFakeTimers();

    const mockFetch = vi.fn().mockResolvedValue(new Response("ok"));

    await fetchWithTimeout("https://example.com", {}, 1000, mockFetch as unknown as typeof fetch);

    const timerCountBefore = vi.getTimerCount();
    // Verify there are no timers left (the timeout was cleared)
    expect(timerCountBefore).toBe(0);
  });

  it("handles fetch rejection and clears timeout", async () => {
    vi.useFakeTimers();

    const mockFetch = vi.fn().mockRejectedValue(new Error("Network Error"));

    await expect(fetchWithTimeout("https://example.com", {}, 1000, mockFetch as unknown as typeof fetch))
      .rejects.toThrow("Network Error");

    const timerCountBefore = vi.getTimerCount();
    expect(timerCountBefore).toBe(0);
  });
});
