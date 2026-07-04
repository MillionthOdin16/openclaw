import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("stringifies primitives", () => {
    expect(safeJsonStringify(1)).toBe("1");
    expect(safeJsonStringify("hello")).toBe('"hello"');
    expect(safeJsonStringify(true)).toBe("true");
    expect(safeJsonStringify(null)).toBe("null");
  });

  it("stringifies bigint", () => {
    expect(safeJsonStringify(BigInt(9007199254740991))).toBe('"9007199254740991"');
  });

  it("stringifies functions", () => {
    expect(safeJsonStringify(() => {})).toBe('"[Function]"');
  });

  it("stringifies Error objects", () => {
    const err = new Error("test error");
    const json = safeJsonStringify(err);
    expect(json).toContain('"name":"Error"');
    expect(json).toContain('"message":"test error"');
    expect(json).toContain('"stack"');
  });

  it("stringifies Uint8Array objects", () => {
    const data = new Uint8Array([1, 2, 3]);
    const json = safeJsonStringify(data);
    expect(json).toContain('"type":"Uint8Array"');
    expect(json).toContain('"data":"AQID"'); // base64 of [1, 2, 3]
  });

  it("stringifies plain objects and arrays", () => {
    expect(safeJsonStringify({ a: 1, b: "two" })).toBe('{"a":1,"b":"two"}');
    expect(safeJsonStringify([1, "two"])).toBe('[1,"two"]');
  });

  it("returns null on circular references", () => {
    const obj: Record<string, unknown> = {};
    obj.circular = obj;
    // JSON.stringify will throw an error for circular references, and safeJsonStringify should catch it and return null.
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
