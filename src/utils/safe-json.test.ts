import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("serializes standard objects", () => {
    expect(safeJsonStringify({ a: 1, b: "two" })).toBe('{"a":1,"b":"two"}');
  });

  it("handles bigint", () => {
    expect(safeJsonStringify({ val: 9007199254740991n })).toBe('{"val":"9007199254740991"}');
  });

  it("handles functions", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it("handles errors", () => {
    const err = new Error("test error");
    const result = safeJsonStringify({ err });
    expect(result).toContain('"name":"Error"');
    expect(result).toContain('"message":"test error"');
    expect(result).toContain('"stack":');
  });

  it("handles Uint8Array", () => {
    const arr = new Uint8Array([1, 2, 3]);
    const result = safeJsonStringify({ arr });
    expect(result).toContain('"type":"Uint8Array"');
    expect(result).toContain('"data":"AQID"');
  });

  it("returns null on stringify error (like circular structures)", () => {
    const obj: Record<string, unknown> = {};
    obj.circular = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
