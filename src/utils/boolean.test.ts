import { describe, expect, it } from "vitest";
import { parseBooleanValue } from "./boolean.js";

describe("parseBooleanValue", () => {
  it("should return the boolean directly if it's already a boolean", () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("should return undefined for non-string, non-boolean values", () => {
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue(undefined)).toBeUndefined();
    expect(parseBooleanValue(123)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
    expect(parseBooleanValue([])).toBeUndefined();
  });

  it("should return undefined for empty or whitespace-only strings", () => {
    expect(parseBooleanValue("")).toBeUndefined();
    expect(parseBooleanValue("   ")).toBeUndefined();
    expect(parseBooleanValue("\n\t")).toBeUndefined();
  });

  it("should parse default truthy strings", () => {
    const truthy = ["true", "1", "yes", "on", " TRUE ", "Yes", "ON"];
    for (const val of truthy) {
      expect(parseBooleanValue(val)).toBe(true);
    }
  });

  it("should parse default falsy strings", () => {
    const falsy = ["false", "0", "no", "off", " FALSE ", "No", "oFf"];
    for (const val of falsy) {
      expect(parseBooleanValue(val)).toBe(false);
    }
  });

  it("should return undefined for string values that are neither truthy nor falsy", () => {
    expect(parseBooleanValue("unknown")).toBeUndefined();
    expect(parseBooleanValue("maybe")).toBeUndefined();
    expect(parseBooleanValue("2")).toBeUndefined();
    expect(parseBooleanValue("trueish")).toBeUndefined();
  });

  it("should respect custom truthy options", () => {
    const options = { truthy: ["yep", "sure"] };
    expect(parseBooleanValue("yep", options)).toBe(true);
    expect(parseBooleanValue("sure", options)).toBe(true);
    // Defaults are overridden
    expect(parseBooleanValue("true", options)).toBeUndefined();
    expect(parseBooleanValue("yes", options)).toBeUndefined();
    // Default falsy options still apply
    expect(parseBooleanValue("false", options)).toBe(false);
  });

  it("should respect custom falsy options", () => {
    const options = { falsy: ["nope", "nah"] };
    expect(parseBooleanValue("nope", options)).toBe(false);
    expect(parseBooleanValue("nah", options)).toBe(false);
    // Defaults are overridden
    expect(parseBooleanValue("false", options)).toBeUndefined();
    expect(parseBooleanValue("no", options)).toBeUndefined();
    // Default truthy options still apply
    expect(parseBooleanValue("true", options)).toBe(true);
  });

  it("should respect custom truthy and falsy options simultaneously", () => {
    const options = { truthy: ["enable"], falsy: ["disable"] };
    expect(parseBooleanValue("enable", options)).toBe(true);
    expect(parseBooleanValue("disable", options)).toBe(false);
    expect(parseBooleanValue("true", options)).toBeUndefined();
    expect(parseBooleanValue("false", options)).toBeUndefined();
  });
});
