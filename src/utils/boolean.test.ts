import { describe, expect, it } from "vitest";
import { parseBooleanValue } from "./boolean.js";

describe("parseBooleanValue", () => {
  it("should return boolean true for true", () => {
    expect(parseBooleanValue(true)).toBe(true);
  });

  it("should return boolean false for false", () => {
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("should return undefined for non-string, non-boolean values", () => {
    expect(parseBooleanValue(123)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
    expect(parseBooleanValue(null)).toBeUndefined();
  });

  it("should return undefined for empty string or whitespace", () => {
    expect(parseBooleanValue("")).toBeUndefined();
    expect(parseBooleanValue("   ")).toBeUndefined();
  });

  it("should parse default truthy values", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
    expect(parseBooleanValue("  TRUE  ")).toBe(true);
  });

  it("should parse default falsy values", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
    expect(parseBooleanValue("  FALSE  ")).toBe(false);
  });

  it("should return undefined for unrecognized strings", () => {
    expect(parseBooleanValue("maybe")).toBeUndefined();
    expect(parseBooleanValue("2")).toBeUndefined();
  });

  it("should parse custom truthy/falsy values", () => {
    const options = { truthy: ["yep"], falsy: ["nope"] };
    expect(parseBooleanValue("yep", options)).toBe(true);
    expect(parseBooleanValue("nope", options)).toBe(false);
    expect(parseBooleanValue("true", options)).toBeUndefined();
  });
});
