import { describe, expect, it } from "vitest";
import { parseBooleanValue } from "./boolean.js";

describe("parseBooleanValue", () => {
  it("should return boolean directly if already a boolean", () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("should return undefined for non-string, non-boolean values", () => {
    expect(parseBooleanValue(1)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue(undefined)).toBeUndefined();
  });

  it("should return undefined for empty string or whitespace", () => {
    expect(parseBooleanValue("")).toBeUndefined();
    expect(parseBooleanValue("   ")).toBeUndefined();
  });

  it("should handle default truthy values", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
    expect(parseBooleanValue("  TrUe  ")).toBe(true); // check trimming and casing
  });

  it("should handle default falsy values", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
    expect(parseBooleanValue(" FaLsE ")).toBe(false); // check trimming and casing
  });

  it("should handle custom truthy values", () => {
    expect(parseBooleanValue("si", { truthy: ["si"] })).toBe(true);
    expect(parseBooleanValue("oui", { truthy: ["si", "oui"] })).toBe(true);
    expect(parseBooleanValue("true", { truthy: ["si"] })).toBeUndefined(); // default truthy no longer applies if custom is provided and 'true' is not in it
  });

  it("should handle custom falsy values", () => {
    expect(parseBooleanValue("nay", { falsy: ["nay"] })).toBe(false);
    expect(parseBooleanValue("non", { falsy: ["nay", "non"] })).toBe(false);
    expect(parseBooleanValue("false", { falsy: ["nay"] })).toBeUndefined(); // default falsy no longer applies
  });

  it("should return undefined for unknown strings", () => {
    expect(parseBooleanValue("maybe")).toBeUndefined();
    expect(parseBooleanValue("123")).toBeUndefined();
  });
});
