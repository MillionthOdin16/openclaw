import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("should stringify simple objects", () => {
    expect(safeJsonStringify({ a: 1, b: "two" })).toBe('{"a":1,"b":"two"}');
  });

  it("should stringify bigints as strings", () => {
    expect(safeJsonStringify({ val: 12345678901234567890n })).toBe('{"val":"12345678901234567890"}');
  });

  it("should replace functions with '[Function]'", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it("should stringify errors, extracting name, message, and stack", () => {
    const err = new Error("test error");
    const result = safeJsonStringify({ error: err });
    expect(result).toContain('"name":"Error"');
    expect(result).toContain('"message":"test error"');
    expect(result).toContain('"stack":');
  });

  it("should stringify Uint8Array as base64", () => {
    const data = new Uint8Array([1, 2, 3]);
    const result = safeJsonStringify({ data });
    expect(result).toContain('"type":"Uint8Array"');
    expect(result).toContain('"data":"');
  });

  it("should return null if stringification fails", () => {
    const obj: any = {};
    obj.circular = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
