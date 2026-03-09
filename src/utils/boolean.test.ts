import { describe, expect, it } from "vitest";
import { parseBooleanValue } from "./boolean.ts";

describe("parseBooleanValue", () => {
  it("should return the original boolean if passed a boolean", () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("should return undefined for non-string, non-boolean values", () => {
    expect(parseBooleanValue(123)).toBeUndefined();
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
  });

  it("should return undefined for empty or whitespace strings", () => {
    expect(parseBooleanValue("")).toBeUndefined();
    expect(parseBooleanValue("   ")).toBeUndefined();
  });

  it("should return true for default truthy values", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
    expect(parseBooleanValue(" TRUE ")).toBe(true);
  });

  it("should return false for default falsy values", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
    expect(parseBooleanValue("  FALSE  ")).toBe(false);
  });

  it("should return undefined for unknown strings", () => {
    expect(parseBooleanValue("unknown")).toBeUndefined();
    expect(parseBooleanValue("2")).toBeUndefined();
  });

  it("should use custom truthy and falsy values", () => {
    const options = { truthy: ["yup", "yeah"], falsy: ["nope", "nah"] };

    expect(parseBooleanValue("yup", options)).toBe(true);
    expect(parseBooleanValue("yeah", options)).toBe(true);

    expect(parseBooleanValue("nope", options)).toBe(false);
    expect(parseBooleanValue("nah", options)).toBe(false);

    expect(parseBooleanValue("true", options)).toBeUndefined();
    expect(parseBooleanValue("false", options)).toBeUndefined();
  });
});
