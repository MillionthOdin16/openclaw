import { describe, expect, it, vi } from "vitest";
import { isReadHttpMethod, respondPlainText, respondNotFound } from "./control-ui-http-utils.js";
import type { ServerResponse } from "node:http";

describe("control-ui-http-utils", () => {
  describe("isReadHttpMethod", () => {
    it("returns true for GET", () => {
      expect(isReadHttpMethod("GET")).toBe(true);
    });

    it("returns true for HEAD", () => {
      expect(isReadHttpMethod("HEAD")).toBe(true);
    });

    it("returns false for POST", () => {
      expect(isReadHttpMethod("POST")).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isReadHttpMethod(undefined)).toBe(false);
    });

    it("returns false for other methods", () => {
      expect(isReadHttpMethod("PUT")).toBe(false);
      expect(isReadHttpMethod("DELETE")).toBe(false);
      expect(isReadHttpMethod("OPTIONS")).toBe(false);
    });
  });

  describe("respondPlainText", () => {
    it("sets status code, headers and body", () => {
      const setHeader = vi.fn();
      const end = vi.fn();
      const res = {
        statusCode: 200,
        setHeader,
        end,
      } as unknown as ServerResponse;

      respondPlainText(res, 400, "Bad Request");

      expect(res.statusCode).toBe(400);
      expect(setHeader).toHaveBeenCalledWith("Content-Type", "text/plain; charset=utf-8");
      expect(end).toHaveBeenCalledWith("Bad Request");
    });
  });

  describe("respondNotFound", () => {
    it("responds with 404 Not Found", () => {
      const setHeader = vi.fn();
      const end = vi.fn();
      const res = {
        statusCode: 200,
        setHeader,
        end,
      } as unknown as ServerResponse;

      respondNotFound(res);

      expect(res.statusCode).toBe(404);
      expect(setHeader).toHaveBeenCalledWith("Content-Type", "text/plain; charset=utf-8");
      expect(end).toHaveBeenCalledWith("Not Found");
    });
  });
});
