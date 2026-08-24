import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("stringifies primitives", () => {
    expect(safeJsonStringify("hello")).toBe('"hello"');
    expect(safeJsonStringify(123)).toBe("123");
    expect(safeJsonStringify(true)).toBe("true");
    expect(safeJsonStringify(null)).toBe("null");
  });

  it("stringifies bigints as strings", () => {
    expect(safeJsonStringify({ val: 123n })).toBe('{"val":"123"}');
  });

  it("stringifies functions as [Function]", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it("stringifies errors safely", () => {
    const err = new Error("boom");
    err.stack = "Error: boom\\n  at oops";
    const result = safeJsonStringify({ error: err });
    expect(result).toContain('"name":"Error"');
    expect(result).toContain('"message":"boom"');
    expect(result).toContain('"stack":"Error: boom\\\\n  at oops"');
  });

  it("stringifies Uint8Array safely", () => {
    const arr = new Uint8Array([104, 105]); // "hi"
    const result = safeJsonStringify(arr);
    expect(result).toBe('{"type":"Uint8Array","data":"aGk="}');
  });

  it("returns null on circular references or failure", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = {};
    obj.self = obj;
    // JSON.stringify will throw on circular references
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
