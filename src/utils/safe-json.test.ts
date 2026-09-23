import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("stringifies standard json", () => {
    expect(safeJsonStringify({ a: 1, b: "two", c: true, d: null })).toBe('{"a":1,"b":"two","c":true,"d":null}');
    expect(safeJsonStringify([1, 2, 3])).toBe('[1,2,3]');
  });

  it("handles BigInt correctly", () => {
    expect(safeJsonStringify({ val: 12345678901234567890n })).toBe('{"val":"12345678901234567890"}');
    expect(safeJsonStringify([1n, 2n])).toBe('["1","2"]');
  });

  it("handles Functions correctly", () => {
    expect(safeJsonStringify({ func: () => {} })).toBe('{"func":"[Function]"}');
    expect(safeJsonStringify(function myFunc() {})).toBe('"[Function]"');
  });

  it("handles Error objects correctly", () => {
    const err = new Error("Something went wrong");
    err.name = "CustomError";
    const str = safeJsonStringify({ error: err });
    expect(str).toContain('"name":"CustomError"');
    expect(str).toContain('"message":"Something went wrong"');
    expect(str).toContain('"stack":');
  });

  it("handles Uint8Array correctly", () => {
    const arr = new Uint8Array([104, 101, 108, 108, 111]);
    const str = safeJsonStringify({ data: arr });
    expect(str).toBe('{"data":{"type":"Uint8Array","data":"aGVsbG8="}}');
  });

  it("returns null on circular references or JSON.stringify errors", () => {
    const obj: Record<string, unknown> = {};
    obj.circular = obj;
    expect(safeJsonStringify(obj)).toBe(null);
  });
});
