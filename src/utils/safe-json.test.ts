import { describe, it, expect } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("should stringify primitive types", () => {
    expect(safeJsonStringify("test")).toBe('"test"');
    expect(safeJsonStringify(123)).toBe("123");
    expect(safeJsonStringify(true)).toBe("true");
    expect(safeJsonStringify(null)).toBe("null");
  });

  it("should handle bigints", () => {
    expect(safeJsonStringify(123n)).toBe('"123"');
  });

  it("should handle functions", () => {
    expect(safeJsonStringify(() => {})).toBe('"[Function]"');
  });

  it("should handle errors", () => {
    const error = new Error("test error");
    error.stack = "test stack"; // Mock stack for consistency in tests if needed
    const result = safeJsonStringify(error);
    expect(result).toContain('"name":"Error"');
    expect(result).toContain('"message":"test error"');
    expect(result).toContain('"stack":"test stack"');
  });

  it("should handle Uint8Arrays", () => {
    const arr = new Uint8Array([1, 2, 3]);
    const result = safeJsonStringify(arr);
    expect(result).toBe('{"type":"Uint8Array","data":"AQID"}');
  });

  it("should handle circular references gracefully (returning null)", () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBe(null);
  });
});
