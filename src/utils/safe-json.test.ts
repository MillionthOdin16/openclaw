import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("stringifies basic types correctly", () => {
    expect(safeJsonStringify({ a: 1, b: "two", c: true, d: null })).toBe(
      '{"a":1,"b":"two","c":true,"d":null}',
    );
    expect(safeJsonStringify([1, "two", true, null])).toBe('[1,"two",true,null]');
    expect(safeJsonStringify(123)).toBe("123");
    expect(safeJsonStringify("hello")).toBe('"hello"');
  });

  it("handles bigints by converting them to strings", () => {
    expect(safeJsonStringify({ value: 12345678901234567890n })).toBe(
      '{"value":"12345678901234567890"}',
    );
  });

  it("handles functions by converting them to '[Function]'", () => {
    expect(safeJsonStringify({ func: () => {} })).toBe('{"func":"[Function]"}');
  });

  it("handles Error objects by extracting name, message, and stack", () => {
    const error = new Error("Something went wrong");
    error.stack = "Error: Something went wrong\n    at some_func";

    const result = safeJsonStringify({ err: error });
    expect(result).toContain('"name":"Error"');
    expect(result).toContain('"message":"Something went wrong"');
    expect(result).toContain('"stack":"Error: Something went wrong\\n    at some_func"');
  });

  it("handles Uint8Array objects by converting them to base64", () => {
    const arr = new Uint8Array([104, 101, 108, 108, 111]); // 'hello' in utf8
    const result = safeJsonStringify({ data: arr });
    expect(result).toBe('{"data":{"type":"Uint8Array","data":"aGVsbG8="}}');
  });

  it("returns null for objects with circular references", () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    // Actually, JSON.stringify throws on circular references, our catch block should return null
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
