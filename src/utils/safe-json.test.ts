import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("should stringify primitive values", () => {
    expect(safeJsonStringify(42)).toBe("42");
    expect(safeJsonStringify("test")).toBe('"test"');
    expect(safeJsonStringify(true)).toBe("true");
    expect(safeJsonStringify(null)).toBe("null");
  });

  it("should stringify objects and arrays", () => {
    expect(safeJsonStringify({ a: 1, b: "two" })).toBe('{"a":1,"b":"two"}');
    expect(safeJsonStringify([1, 2, 3])).toBe("[1,2,3]");
  });

  it("should handle BigInt values", () => {
    expect(safeJsonStringify({ num: 9007199254740991n })).toBe('{"num":"9007199254740991"}');
  });

  it("should handle Functions", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it("should handle Error instances", () => {
    const err = new Error("test error");
    const result = safeJsonStringify(err);
    expect(result).toContain('"name":"Error"');
    expect(result).toContain('"message":"test error"');
    expect(result).toContain('"stack"');
  });

  it("should handle Uint8Array instances", () => {
    const arr = new Uint8Array([1, 2, 3]);
    expect(safeJsonStringify(arr)).toBe('{"type":"Uint8Array","data":"AQID"}');
  });

  it("should return null for circular references", () => {
    const obj: Record<string, unknown> = {};
    obj.circular = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
