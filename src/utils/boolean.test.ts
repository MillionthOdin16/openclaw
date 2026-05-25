import { describe, expect, it } from "vitest";
import { parseBooleanValue } from "./boolean.js";

describe("parseBooleanValue", () => {
  it("returns true for boolean true", () => {
    expect(parseBooleanValue(true)).toBe(true);
  });

  it("returns false for boolean false", () => {
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("returns undefined for non-boolean and non-string values", () => {
    expect(parseBooleanValue(123)).toBeUndefined();
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
  });

  it("returns undefined for empty strings", () => {
    expect(parseBooleanValue("")).toBeUndefined();
    expect(parseBooleanValue("  ")).toBeUndefined();
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

  it("handles mixed case and whitespace", () => {
    expect(parseBooleanValue(" True ")).toBe(true);
    expect(parseBooleanValue(" fAlSe ")).toBe(false);
  });

  it("uses custom truthy and falsy values", () => {
    const options = { truthy: ["yep"], falsy: ["nope"] };
    expect(parseBooleanValue("yep", options)).toBe(true);
    expect(parseBooleanValue("nope", options)).toBe(false);
    expect(parseBooleanValue("true", options)).toBeUndefined(); // Default "true" is ignored if custom is provided
  });
});
