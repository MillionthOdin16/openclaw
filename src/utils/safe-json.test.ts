import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("stringifies standard JSON values", () => {
    expect(safeJsonStringify({ a: 1, b: "two", c: true, d: null })).toBe(
      '{"a":1,"b":"two","c":true,"d":null}'
    );
    expect(safeJsonStringify([1, 2, 3])).toBe("[1,2,3]");
  });

  it("handles BigInt by converting to string", () => {
    expect(safeJsonStringify({ big: 9007199254740991n })).toBe('{"big":"9007199254740991"}');
  });

  it("handles functions by returning '[Function]'", () => {
    const obj = {
      fn: () => {},
    };
    expect(safeJsonStringify(obj)).toBe('{"fn":"[Function]"}');
  });

  it("handles Error objects by extracting name, message, and stack", () => {
    const error = new Error("Something went wrong");
    error.name = "CustomError";
    const result = safeJsonStringify({ err: error });
    expect(result).toContain('"name":"CustomError"');
    expect(result).toContain('"message":"Something went wrong"');
    expect(result).toContain('"stack":'); // Stack trace will be present
  });

  it("handles Uint8Array by converting to base64 object", () => {
    const arr = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const result = safeJsonStringify({ data: arr });
    expect(result).toBe('{"data":{"type":"Uint8Array","data":"SGVsbG8="}}');
  });

  it("returns null when JSON.stringify throws an error", () => {
    // Create a circular dependency
    const circularObj: any = {};
    circularObj.self = circularObj;

    expect(safeJsonStringify(circularObj)).toBeNull();
  });
});
