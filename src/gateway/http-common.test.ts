import { describe, expect, it, vi } from "vitest";
import type { ServerResponse } from "node:http";
import { setSecurityHeaders } from "./http-common.js";

describe("setSecurityHeaders", () => {
  it("sets security headers", () => {
    const setHeader = vi.fn();
    const res = {
      setHeader,
    } as unknown as ServerResponse;

    setSecurityHeaders(res);

    expect(setHeader).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff");
    expect(setHeader).toHaveBeenCalledWith("Referrer-Policy", "no-referrer");
  });
});
