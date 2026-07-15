import { describe, it, expect } from "vitest";
import { parseBooleanValue } from "./boolean";

describe("parseBooleanValue", () => {
  it("should return the boolean if value is already a boolean", () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("should return undefined if value is not a string or boolean", () => {
    expect(parseBooleanValue(123)).toBeUndefined();
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue(undefined)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
    expect(parseBooleanValue([])).toBeUndefined();
  });

  it("should return undefined for empty or whitespace strings", () => {
    expect(parseBooleanValue("")).toBeUndefined();
    expect(parseBooleanValue("   ")).toBeUndefined();
  });

  it("should parse default truthy values", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
    expect(parseBooleanValue(" TRUE  ")).toBe(true);
  });

  it("should parse default falsy values", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
    expect(parseBooleanValue("  FALSE ")).toBe(false);
  });

  it("should return undefined for unrecognized strings", () => {
    expect(parseBooleanValue("maybe")).toBeUndefined();
    expect(parseBooleanValue("foo")).toBeUndefined();
  });

  it("should respect custom truthy and falsy options", () => {
    const options = {
      truthy: ["yep", "y"],
      falsy: ["nope", "n"]
    };

    expect(parseBooleanValue("yep", options)).toBe(true);
    expect(parseBooleanValue("Y", options)).toBe(true);
    expect(parseBooleanValue("nope", options)).toBe(false);
    expect(parseBooleanValue("N", options)).toBe(false);
    expect(parseBooleanValue("true", options)).toBeUndefined(); // default shouldn't apply
    expect(parseBooleanValue("false", options)).toBeUndefined();
  });
});
