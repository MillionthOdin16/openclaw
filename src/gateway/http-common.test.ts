import type { ServerResponse } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { setDefaultSecurityHeaders } from "./http-common.js";

describe("setDefaultSecurityHeaders", () => {
  it("sets default security headers", () => {
    const setHeader = vi.fn();
    const res = {
      setHeader,
    } as unknown as ServerResponse;

    setDefaultSecurityHeaders(res);

    expect(setHeader).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff");
    expect(setHeader).toHaveBeenCalledWith("Referrer-Policy", "no-referrer");
    expect(setHeader).toHaveBeenCalledWith(
      "Permissions-Policy",
      "browsing-topics=(), interest-cohort=(), payment=()",
    );
  });
});
