import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("stringifies standard JSON values", () => {
    expect(safeJsonStringify({ a: 1, b: "two", c: true })).toBe('{"a":1,"b":"two","c":true}');
    expect(safeJsonStringify([1, 2, 3])).toBe("[1,2,3]");
    expect(safeJsonStringify(null)).toBe("null");
  });

  it("handles bigint values by converting to string", () => {
    expect(safeJsonStringify({ num: 123n })).toBe('{"num":"123"}');
  });

  it("handles functions by converting to '[Function]'", () => {
    const fn = () => {};
    expect(safeJsonStringify({ func: fn })).toBe('{"func":"[Function]"}');
  });

  it("handles Error objects by extracting standard properties", () => {
    const err = new Error("Test error");
    const json = safeJsonStringify({ error: err });
    expect(json).toContain('"name":"Error"');
    expect(json).toContain('"message":"Test error"');
    expect(json).toContain('"stack"');
  });

  it("handles Uint8Array objects by converting to base64", () => {
    const array = new Uint8Array([104, 101, 108, 108, 111]); // "hello"
    expect(safeJsonStringify({ data: array })).toBe(
      '{"data":{"type":"Uint8Array","data":"aGVsbG8="}}',
    );
  });

  it("returns null on circular reference", () => {
    const obj: Record<string, unknown> = {};
    obj.circular = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
