import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json";

describe("safeJsonStringify", () => {
  it("should stringify simple objects correctly", () => {
    expect(safeJsonStringify({ key: "value" })).toBe('{"key":"value"}');
    expect(safeJsonStringify([1, 2, 3])).toBe('[1,2,3]');
  });

  it("should handle bigints", () => {
    expect(safeJsonStringify({ num: BigInt(9007199254740991) })).toBe('{"num":"9007199254740991"}');
  });

  it("should handle functions", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it("should handle Error objects", () => {
    const err = new Error("test error");
    const result = safeJsonStringify({ error: err });
    expect(result).toContain('"name":"Error"');
    expect(result).toContain('"message":"test error"');
    expect(result).toContain('"stack"');
  });

  it("should handle Uint8Array correctly", () => {
    const arr = new Uint8Array([72, 101, 108, 108, 111]);
    const result = safeJsonStringify(arr);
    expect(result).toBe('{"type":"Uint8Array","data":"SGVsbG8="}');
  });

  it("should return null for circular structures", () => {
    const obj: any = {};
    obj.circular = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
