import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("stringifies standard objects", () => {
    expect(safeJsonStringify({ a: 1, b: "two", c: true })).toBe('{"a":1,"b":"two","c":true}');
  });

  it("handles null and undefined", () => {
    expect(safeJsonStringify(null)).toBe("null");
    expect(safeJsonStringify(undefined)).toBeUndefined();
  });

  it("handles arrays", () => {
    expect(safeJsonStringify([1, "two", null])).toBe('[1,"two",null]');
  });

  it("stringifies BigInt as string", () => {
    expect(safeJsonStringify({ big: 9007199254740991n })).toBe('{"big":"9007199254740991"}');
  });

  it("stringifies functions as '[Function]'", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it("stringifies Error objects with name, message, stack", () => {
    const error = new Error("test error");
    const json = safeJsonStringify({ err: error })!;
    expect(json).toContain('"name":"Error"');
    expect(json).toContain('"message":"test error"');
    expect(json).toContain('"stack":');
  });

  it("stringifies Uint8Array correctly using base64", () => {
    const buf = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const expectedData = Buffer.from(buf).toString("base64");
    expect(safeJsonStringify({ buf })).toBe(`{"buf":{"type":"Uint8Array","data":"${expectedData}"}}`);
  });

  it("returns null for circular references", () => {
    const obj: Record<string, unknown> = {};
    obj.circular = obj;
    // Circular references usually throw in standard JSON.stringify without replacers to handle them,
    // but the fallback catch should return null
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
