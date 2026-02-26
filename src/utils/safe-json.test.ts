import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("serializes basic primitives", () => {
    expect(safeJsonStringify("hello")).toBe('"hello"');
    expect(safeJsonStringify(123)).toBe("123");
    expect(safeJsonStringify(true)).toBe("true");
    expect(safeJsonStringify(null)).toBe("null");
  });

  it("serializes arrays and objects", () => {
    expect(safeJsonStringify([1, 2, 3])).toBe("[1,2,3]");
    expect(safeJsonStringify({ a: 1, b: "two" })).toBe('{"a":1,"b":"two"}');
  });

  it("serializes BigInt as string", () => {
    expect(safeJsonStringify(123n)).toBe('"123"');
    expect(safeJsonStringify({ val: 456n })).toBe('{"val":"456"}');
  });

  it("serializes Function as placeholder", () => {
    const fn = () => {};
    expect(safeJsonStringify(fn)).toBe('"[Function]"');
    expect(safeJsonStringify({ callback: fn })).toBe('{"callback":"[Function]"}');
  });

  it("serializes Error objects", () => {
    const error = new Error("something went wrong");
    const json = safeJsonStringify(error);
    expect(json).toContain('"name":"Error"');
    expect(json).toContain('"message":"something went wrong"');
    expect(json).toContain('"stack":');
  });

  it("serializes Uint8Array as base64 object", () => {
    const data = new Uint8Array([1, 2, 3]);
    const json = safeJsonStringify(data);
    // Base64 of [1,2,3] is AQID
    expect(json).toContain('"type":"Uint8Array"');
    expect(json).toContain('"data":"AQID"');
  });

  it("returns null for undefined input", () => {
    // This test expects safeJsonStringify(undefined) to return null,
    // matching the return type `string | null`.
    expect(safeJsonStringify(undefined)).toBeNull();
  });

  it("returns null for circular references", () => {
    const obj: any = { a: 1 };
    obj.self = obj;
    // JSON.stringify throws for circular references, safeJsonStringify should catch and return null
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
