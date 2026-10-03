import { describe, it, expect } from "vitest";
import { parseBooleanValue } from "./boolean.ts";

describe("parseBooleanValue", () => {
  it("should return boolean directly", () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("should handle invalid types", () => {
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue(undefined)).toBeUndefined();
    expect(parseBooleanValue(1)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
  });

  it("should handle empty or whitespace strings", () => {
    expect(parseBooleanValue("")).toBeUndefined();
    expect(parseBooleanValue("   ")).toBeUndefined();
  });

  it("should handle default truthy values", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
    expect(parseBooleanValue("TRUE")).toBe(true);
    expect(parseBooleanValue("  true  ")).toBe(true);
  });

  it("should handle default falsy values", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
    expect(parseBooleanValue("FALSE")).toBe(false);
    expect(parseBooleanValue("  false  ")).toBe(false);
  });

  it("should handle custom truthy values", () => {
    expect(parseBooleanValue("yep", { truthy: ["yep"] })).toBe(true);
    expect(parseBooleanValue("true", { truthy: ["yep"] })).toBeUndefined();
  });

  it("should handle custom falsy values", () => {
    expect(parseBooleanValue("nope", { falsy: ["nope"] })).toBe(false);
    expect(parseBooleanValue("false", { falsy: ["nope"] })).toBeUndefined();
  });

  it("should handle unrecognized strings", () => {
    expect(parseBooleanValue("maybe")).toBeUndefined();
    expect(parseBooleanValue("2")).toBeUndefined();
  });
});
