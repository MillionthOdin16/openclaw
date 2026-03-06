import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("stringifies basic objects", () => {
    expect(safeJsonStringify({ a: 1, b: "two" })).toBe('{"a":1,"b":"two"}');
  });

  it("handles bigint", () => {
    expect(safeJsonStringify({ big: 123n })).toBe('{"big":"123"}');
  });

  it("handles functions", () => {
    expect(safeJsonStringify({ func: () => {} })).toBe('{"func":"[Function]"}');
  });

  it("handles error objects", () => {
    const err = new Error("oops");
    err.name = "CustomError";
    const result = safeJsonStringify({ err }) as string;

    expect(result).toContain('"name":"CustomError"');
    expect(result).toContain('"message":"oops"');
    expect(result).toContain('"stack":');
  });

  it("handles Uint8Array", () => {
    const arr = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const result = safeJsonStringify({ arr }) as string;

    expect(result).toContain('"type":"Uint8Array"');
    expect(result).toContain('"data":"SGVsbG8="'); // Base64 for "Hello"
  });

  it("returns null for circular references", () => {
    const obj: any = {};
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });

  it("returns null when JSON.stringify throws for other reasons", () => {
    // Override JSON.stringify temporarily
    const originalStringify = JSON.stringify;
    try {
      JSON.stringify = () => {
        throw new Error("Failed to stringify");
      };
      expect(safeJsonStringify({ a: 1 })).toBeNull();
    } finally {
      JSON.stringify = originalStringify;
    }
  });
});