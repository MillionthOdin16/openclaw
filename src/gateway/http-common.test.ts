import { describe, expect, it } from "vitest";
import { makeMockHttpResponse } from "./test-http-response.js";
import { setDefaultSecurityHeaders } from "./http-common.js";

describe("setDefaultSecurityHeaders", () => {
  it("sets standard security headers", () => {
    const { res } = makeMockHttpResponse();
    setDefaultSecurityHeaders(res);
    expect(res.headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(res.headers["Referrer-Policy"]).toBe("no-referrer");
    expect(res.headers["X-Permitted-Cross-Domain-Policies"]).toBe("none");
    expect(res.headers["Cross-Origin-Resource-Policy"]).toBe("same-origin");
  });

  it("includes HSTS if configured", () => {
    const { res } = makeMockHttpResponse();
    setDefaultSecurityHeaders(res, { strictTransportSecurity: "max-age=31536000" });
    expect(res.headers["Strict-Transport-Security"]).toBe("max-age=31536000");
  });

  it("omits HSTS if not configured", () => {
    const { res } = makeMockHttpResponse();
    setDefaultSecurityHeaders(res);
    expect(res.headers["Strict-Transport-Security"]).toBeUndefined();
  });
});
