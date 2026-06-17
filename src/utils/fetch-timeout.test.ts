import { describe, expect, it, vi } from "vitest";
import { bindAbortRelay, fetchWithTimeout } from "./fetch-timeout.js";

describe("bindAbortRelay", () => {
  it("should bind abort to the controller", () => {
    const controller = new AbortController();
    const relay = bindAbortRelay(controller);

    expect(controller.signal.aborted).toBe(false);
    relay();
    expect(controller.signal.aborted).toBe(true);
  });
});

describe("fetchWithTimeout", () => {
  it("should return successful response before timeout", async () => {
    const mockResponse = new Response("ok");
    const fetchFn = vi.fn().mockResolvedValue(mockResponse);

    const res = await fetchWithTimeout("http://test.com", {}, 1000, fetchFn);
    expect(res).toBe(mockResponse);
    expect(fetchFn).toHaveBeenCalledWith(
      "http://test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("should abort when timeout is reached", async () => {
    const fetchFn = vi.fn().mockImplementation((_url, init) => {
      return new Promise((resolve, reject) => {
        init.signal.addEventListener("abort", () => {
          reject(new Error("AbortError"));
        });
      });
    });

    await expect(
      fetchWithTimeout("http://test.com", {}, 10, fetchFn as unknown as typeof fetch),
    ).rejects.toThrow("AbortError");
  });

  it("should merge init options and add signal", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response());

    await fetchWithTimeout(
      "http://test.com",
      { method: "POST", headers: { "X-Test": "1" } },
      1000,
      fetchFn,
    );

    expect(fetchFn).toHaveBeenCalledWith("http://test.com", {
      method: "POST",
      headers: { "X-Test": "1" },
      signal: expect.any(AbortSignal),
    });
  });
});
