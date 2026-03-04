import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("stringifies regular JSON objects", () => {
    expect(safeJsonStringify({ foo: "bar", num: 42, bool: true })).toBe(
      '{"foo":"bar","num":42,"bool":true}'
    );
  });

  it("handles BigInt", () => {
    expect(safeJsonStringify({ big: 9007199254740991n })).toBe('{"big":"9007199254740991"}');
  });

  it("handles functions", () => {
    expect(safeJsonStringify({ func: () => {} })).toBe('{"func":"[Function]"}');
  });

  it("handles Error objects", () => {
    const err = new Error("Test error");
    const jsonStr = safeJsonStringify({ err });
    expect(jsonStr).toContain('"name":"Error"');
    expect(jsonStr).toContain('"message":"Test error"');
    expect(jsonStr).toContain('"stack"');
  });

  it("handles Uint8Array base64 serialization", () => {
    const arr = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const jsonStr = safeJsonStringify({ arr });
    expect(jsonStr).toBe('{"arr":{"type":"Uint8Array","data":"SGVsbG8="}}');
  });

  it("returns null on circular references without throwing", () => {
    const obj: any = {};
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });

  it("returns undefined for undefined input", () => {
    // JSON.stringify returns undefined for top-level undefined
    expect(safeJsonStringify(undefined)).toBeUndefined();
  });

  it("handles null input", () => {
    expect(safeJsonStringify(null)).toBe("null");
  });
});
