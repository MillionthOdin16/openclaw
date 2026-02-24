import { describe, expect, it } from "vitest";
import { sendJson, setDefaultSecurityHeaders } from "./http-common.js";
import { makeMockHttpResponse } from "./test-http-response.js";

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
  });

  describe("sendJson", () => {
    it("sends JSON response with correct headers", () => {
      const { res, setHeader, end } = makeMockHttpResponse();
      const body = { foo: "bar" };
      sendJson(res, 200, body);
      expect(res.statusCode).toBe(200);
      expect(setHeader).toHaveBeenCalledWith("Content-Type", "application/json; charset=utf-8");
      expect(setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
      expect(end).toHaveBeenCalledWith(JSON.stringify(body));
    });
  });
});
