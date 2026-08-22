import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("stringifies normal objects", () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
  });

  it("handles bigint", () => {
    expect(safeJsonStringify({ val: 123n })).toBe('{"val":"123"}');
  });

  it("handles functions", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it("handles Errors", () => {
    const err = new Error("test error");
    const result = safeJsonStringify(err);
    expect(result).toContain('"message":"test error"');
    expect(result).toContain('"name":"Error"');
  });

  it("handles Uint8Array", () => {
    const arr = new Uint8Array([1, 2, 3]);
    const result = safeJsonStringify(arr);
    expect(result).toBe('{"type":"Uint8Array","data":"AQID"}');
  });

  it("handles circular references gracefully", () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
