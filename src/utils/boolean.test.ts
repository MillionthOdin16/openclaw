import { describe, it, expect } from "vitest";
import { parseBooleanValue } from "./boolean.ts";

describe("parseBooleanValue", () => {
  it("returns true for boolean true", () => {
    expect(parseBooleanValue(true)).toBe(true);
  });

  it("returns false for boolean false", () => {
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("returns undefined for non-string, non-boolean values", () => {
    expect(parseBooleanValue(1)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
    expect(parseBooleanValue([])).toBeUndefined();
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue(undefined)).toBeUndefined();
  });

  it("returns undefined for empty strings or strings with only whitespace", () => {
    expect(parseBooleanValue("")).toBeUndefined();
    expect(parseBooleanValue("   ")).toBeUndefined();
  });

  it("returns true for default truthy values", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
  });

  it("returns false for default falsy values", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(parseBooleanValue("  TrUe  ")).toBe(true);
    expect(parseBooleanValue(" FaLsE ")).toBe(false);
    expect(parseBooleanValue("YES\n")).toBe(true);
  });

  it("returns undefined for unrecognized string values", () => {
    expect(parseBooleanValue("maybe")).toBeUndefined();
    expect(parseBooleanValue("foo")).toBeUndefined();
    expect(parseBooleanValue("2")).toBeUndefined();
  });

  it("respects custom truthy and falsy options", () => {
    const options = { truthy: ["yep", "sure"], falsy: ["nope", "nah"] };

    expect(parseBooleanValue("yep", options)).toBe(true);
    expect(parseBooleanValue("sure", options)).toBe(true);
    expect(parseBooleanValue("nope", options)).toBe(false);
    expect(parseBooleanValue("nah", options)).toBe(false);

    expect(parseBooleanValue("true", options)).toBeUndefined();
    expect(parseBooleanValue("false", options)).toBeUndefined();
  });

  it("can partially override options", () => {
    expect(parseBooleanValue("yep", { truthy: ["yep"] })).toBe(true);
    expect(parseBooleanValue("false", { truthy: ["yep"] })).toBe(false);

    expect(parseBooleanValue("true", { falsy: ["nope"] })).toBe(true);
    expect(parseBooleanValue("nope", { falsy: ["nope"] })).toBe(false);
  });
});
