import { describe, expect, it } from "vitest";
import { parseBooleanValue } from "./boolean";

describe("parseBooleanValue", () => {
  it("should return the boolean value if input is a boolean", () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("should parse truthy values correctly", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
    expect(parseBooleanValue(" TrUe ")).toBe(true);
  });

  it("should parse falsy values correctly", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
    expect(parseBooleanValue(" FaLsE ")).toBe(false);
  });

  it("should return undefined for invalid string inputs", () => {
    expect(parseBooleanValue("invalid")).toBeUndefined();
    expect(parseBooleanValue("")).toBeUndefined();
    expect(parseBooleanValue("  ")).toBeUndefined();
  });

  it("should return undefined for non-string inputs", () => {
    expect(parseBooleanValue(123)).toBeUndefined();
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue(undefined)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
    expect(parseBooleanValue([])).toBeUndefined();
  });

  it("should support custom truthy values", () => {
    expect(parseBooleanValue("si", { truthy: ["si"] })).toBe(true);
    expect(parseBooleanValue("true", { truthy: ["si"] })).toBeUndefined(); // default truthy values are overridden
  });

  it("should support custom falsy values", () => {
    expect(parseBooleanValue("nope", { falsy: ["nope"] })).toBe(false);
    expect(parseBooleanValue("false", { falsy: ["nope"] })).toBeUndefined(); // default falsy values are overridden
  });
});
