import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("serializes standard JSON types", () => {
    expect(safeJsonStringify({ a: 1, b: "two", c: true, d: null })).toBe('{"a":1,"b":"two","c":true,"d":null}');
    expect(safeJsonStringify([1, "two", false])).toBe('[1,"two",false]');
    expect(safeJsonStringify(123)).toBe("123");
    expect(safeJsonStringify("test")).toBe('"test"');
    expect(safeJsonStringify(true)).toBe("true");
    expect(safeJsonStringify(null)).toBe("null");
  });

  it("returns undefined for top-level undefined", () => {
    // JSON.stringify(undefined) returns undefined, not a string
    expect(safeJsonStringify(undefined)).toBe(undefined);
  });

  it("handles undefined inside objects/arrays correctly", () => {
    expect(safeJsonStringify({ a: undefined })).toBe("{}");
    expect(safeJsonStringify([undefined])).toBe("[null]");
  });

  it("serializes BigInt to string", () => {
    expect(safeJsonStringify({ val: 123n })).toBe('{"val":"123"}');
    expect(safeJsonStringify(123n)).toBe('"123"');
  });

  it("serializes functions to '[Function]'", () => {
    const fn = () => {};
    expect(safeJsonStringify({ val: fn })).toBe('{"val":"[Function]"}');
    expect(safeJsonStringify(fn)).toBe('"[Function]"');
  });

  it("serializes Error instances", () => {
    const err = new Error("test error");
    const json = safeJsonStringify(err);
    expect(json).toBeDefined();

    const parsed = JSON.parse(json as string);
    expect(parsed).toHaveProperty("name", "Error");
    expect(parsed).toHaveProperty("message", "test error");
    expect(parsed).toHaveProperty("stack");
    expect(typeof parsed.stack).toBe("string");
  });

  it("serializes Uint8Array to base64", () => {
    const arr = new Uint8Array([1, 2, 3]);
    const json = safeJsonStringify(arr);
    expect(json).toBe('{"type":"Uint8Array","data":"AQID"}');
  });

  it("handles circular references gracefully by returning null", () => {
    const obj: any = {};
    obj.self = obj;
    // JSON.stringify throws on circular reference, safeJsonStringify catches it and returns null
    expect(safeJsonStringify(obj)).toBe(null);
  });
});
