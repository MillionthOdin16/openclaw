import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";
import { Buffer } from "node:buffer";

describe("safeJsonStringify", () => {
  it("stringifies primitive values", () => {
    expect(safeJsonStringify("hello")).toBe('"hello"');
    expect(safeJsonStringify(42)).toBe('42');
    expect(safeJsonStringify(true)).toBe('true');
    expect(safeJsonStringify(null)).toBe('null');
  });

  it("handles bigints", () => {
    expect(safeJsonStringify({ val: 42n })).toBe('{"val":"42"}');
  });

  it("handles functions", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it("handles Error objects", () => {
    const err = new Error("something went wrong");
    err.stack = "Error: something went wrong\n    at somewhere";
    const res = safeJsonStringify(err);
    expect(res).toContain('"name":"Error"');
    expect(res).toContain('"message":"something went wrong"');
    expect(res).toContain('"stack"');
  });

  it("handles Uint8Array", () => {
    const arr = new Uint8Array([104, 101, 108, 108, 111]); // "hello"
    const expectedBase64 = Buffer.from(arr).toString("base64");
    expect(safeJsonStringify(arr)).toBe(`{"type":"Uint8Array","data":"${expectedBase64}"}`);
  });

  it("handles circular references gracefully", () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
