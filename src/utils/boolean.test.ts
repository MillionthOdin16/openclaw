import { describe, expect, it } from "vitest";
import { parseBooleanValue } from "./boolean.js";

describe("parseBooleanValue", () => {
  it("returns true for exact boolean true", () => {
    expect(parseBooleanValue(true)).toBe(true);
  });

  it("returns false for exact boolean false", () => {
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("returns undefined for non-boolean and non-string inputs", () => {
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue(123)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
    expect(parseBooleanValue([])).toBeUndefined();
  });

  it("returns undefined for empty or whitespace-only strings", () => {
    expect(parseBooleanValue("")).toBeUndefined();
    expect(parseBooleanValue("   ")).toBeUndefined();
  });

  it("returns true for default truthy strings (case-insensitive)", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("TRUE")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
    expect(parseBooleanValue("  true  ")).toBe(true);
  });

  it("returns false for default falsy strings (case-insensitive)", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("FALSE")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
    expect(parseBooleanValue("  false  ")).toBe(false);
  });

  it("returns undefined for unrecognised strings", () => {
    expect(parseBooleanValue("maybe")).toBeUndefined();
    expect(parseBooleanValue("2")).toBeUndefined();
    expect(parseBooleanValue("tru")).toBeUndefined();
  });

  it("supports custom truthy and falsy values", () => {
    const options = { truthy: ["yep", "sure"], falsy: ["nope", "nah"] };

    expect(parseBooleanValue("yep", options)).toBe(true);
    expect(parseBooleanValue("sure", options)).toBe(true);
    expect(parseBooleanValue("nope", options)).toBe(false);
    expect(parseBooleanValue("nah", options)).toBe(false);
  });

  it("supports partial custom overrides", () => {
    expect(parseBooleanValue("yep", { truthy: ["yep"] })).toBe(true);
    expect(parseBooleanValue("true", { truthy: ["yep"] })).toBeUndefined();
    expect(parseBooleanValue("false", { truthy: ["yep"] })).toBe(false);

    expect(parseBooleanValue("nope", { falsy: ["nope"] })).toBe(false);
    expect(parseBooleanValue("false", { falsy: ["nope"] })).toBeUndefined();
    expect(parseBooleanValue("true", { falsy: ["nope"] })).toBe(true);
  });
});
