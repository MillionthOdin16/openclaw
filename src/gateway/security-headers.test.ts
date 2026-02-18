import type { ServerResponse } from "node:http";
import { describe, expect, it } from "vitest";
import { setSecurityHeaders } from "./http-common.js";

describe("security headers", () => {
  it("sets the expected security headers", () => {
    const headers: Record<string, string> = {};
    const res = {
      setHeader: (key: string, value: string) => {
        headers[key] = value;
      },
    } as unknown as ServerResponse;

    setSecurityHeaders(res);

    expect(headers).toEqual({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "DENY",
    });
  });
});
