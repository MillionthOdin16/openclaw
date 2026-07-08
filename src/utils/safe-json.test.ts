import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("stringifies basic types correctly", () => {
    expect(safeJsonStringify({ a: 1, b: "two", c: true, d: null })).toBe('{"a":1,"b":"two","c":true,"d":null}');
  });

  it("handles bigint", () => {
    expect(safeJsonStringify({ val: 12345678901234567890n })).toBe('{"val":"12345678901234567890"}');
  });

  it("handles functions", () => {
    expect(safeJsonStringify({ func: () => {} })).toBe('{"func":"[Function]"}');
  });

  it("handles Error instances", () => {
    const err = new Error("test error");
    const json = safeJsonStringify({ err });
    expect(json).toContain('"name":"Error"');
    expect(json).toContain('"message":"test error"');
    expect(json).toContain('"stack"');
  });

  it("handles Uint8Array", () => {
    const u8 = new Uint8Array([1, 2, 3]);
    const json = safeJsonStringify({ data: u8 });
    expect(json).toBe('{"data":{"type":"Uint8Array","data":"AQID"}}');
  });

  it("returns null on circular references or JSON.stringify failure", () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBe(null);
  });
});
