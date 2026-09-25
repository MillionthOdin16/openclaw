import { describe, expect, it } from "vitest";
import { parseBooleanValue } from "./boolean.js";

describe("parseBooleanValue", () => {
  it("returns value if already boolean", () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("returns undefined for non-string, non-boolean inputs", () => {
    expect(parseBooleanValue(123)).toBeUndefined();
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
  });

  it("returns undefined for empty strings", () => {
    expect(parseBooleanValue("   ")).toBeUndefined();
    expect(parseBooleanValue("")).toBeUndefined();
  });

  it("parses default truthy values correctly", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
    expect(parseBooleanValue("   TRUE   ")).toBe(true);
  });

  it("parses default falsy values correctly", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
    expect(parseBooleanValue("   FALSE   ")).toBe(false);
  });

  it("returns undefined for unrecognized string values", () => {
    expect(parseBooleanValue("maybe")).toBeUndefined();
    expect(parseBooleanValue("2")).toBeUndefined();
  });

  it("allows custom truthy/falsy overrides", () => {
    expect(parseBooleanValue("yup", { truthy: ["yup"], falsy: ["nope"] })).toBe(true);
    expect(parseBooleanValue("nope", { truthy: ["yup"], falsy: ["nope"] })).toBe(false);
    expect(parseBooleanValue("true", { truthy: ["yup"], falsy: ["nope"] })).toBeUndefined();
  });
});
