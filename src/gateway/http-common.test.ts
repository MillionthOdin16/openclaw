import { describe, expect, it } from "vitest";
import { makeMockHttpResponse } from "./test-http-response.js";
import { setDefaultSecurityHeaders } from "./http-common.js";

describe("http-common", () => {
  describe("setDefaultSecurityHeaders", () => {
    it("sets default security headers", () => {
      const { res, setHeader } = makeMockHttpResponse();
      setDefaultSecurityHeaders(res);

      expect(setHeader).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff");
      expect(setHeader).toHaveBeenCalledWith("Referrer-Policy", "no-referrer");
      expect(setHeader).toHaveBeenCalledWith("X-Permitted-Cross-Domain-Policies", "none");
      expect(setHeader).toHaveBeenCalledWith("Cross-Origin-Resource-Policy", "same-origin");
    });

    it("sets Strict-Transport-Security if provided", () => {
      const { res, setHeader } = makeMockHttpResponse();
      setDefaultSecurityHeaders(res, { strictTransportSecurity: "max-age=31536000" });

      expect(setHeader).toHaveBeenCalledWith("Strict-Transport-Security", "max-age=31536000");
    });
  });
});
