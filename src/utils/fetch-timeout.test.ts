import { describe, expect, it, vi } from "vitest";
import { bindAbortRelay, fetchWithTimeout } from "./fetch-timeout.js";

describe("bindAbortRelay", () => {
  it("binds abort to controller without passing event arg", () => {
    const controller = new AbortController();
    const abortSpy = vi.spyOn(controller, "abort");
    const relay = bindAbortRelay(controller);

    // Call as if it was an event listener, passing an event argument
    relay({} as unknown as Event);

    // Should be called without the event argument
    expect(abortSpy).toHaveBeenCalledWith();
    expect(abortSpy).toHaveBeenCalledTimes(1);
  });
});

describe("fetchWithTimeout", () => {
  it("calls fetch with signal and resolves", async () => {
    const mockResponse = new Response("ok");
    const fetchFn = vi.fn().mockResolvedValue(mockResponse);

    const promise = fetchWithTimeout("http://test", { method: "POST" }, 50, fetchFn);
    const result = await promise;

    expect(result).toBe(mockResponse);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn.mock.calls[0][0]).toBe("http://test");
    expect(fetchFn.mock.calls[0][1]).toHaveProperty("method", "POST");
    expect(fetchFn.mock.calls[0][1]).toHaveProperty("signal");
  });

  it("aborts fetch if it takes too long", async () => {
    const fetchFn = vi.fn().mockImplementation((url, init) => {
      return new Promise((resolve, reject) => {
        init.signal.addEventListener("abort", () => {
          reject(new Error("AbortError"));
        });
      });
    });

    await expect(fetchWithTimeout("http://test", {}, 10, fetchFn)).rejects.toThrow("AbortError");
  });

  it("clears timeout on failure", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("fetch failed"));

    await expect(fetchWithTimeout("http://test", {}, 50, fetchFn)).rejects.toThrow("fetch failed");
  });
});
