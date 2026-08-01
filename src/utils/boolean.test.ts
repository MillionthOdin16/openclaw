import { describe, expect, it } from "vitest";
import { parseBooleanValue } from "./boolean.js";

describe("parseBooleanValue", () => {
  it("returns the boolean value if already a boolean", () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("returns undefined for non-string values", () => {
    expect(parseBooleanValue(null)).toBe(undefined);
    expect(parseBooleanValue(1)).toBe(undefined);
    expect(parseBooleanValue({})).toBe(undefined);
  });

  it("returns undefined for empty or whitespace strings", () => {
    expect(parseBooleanValue("")).toBe(undefined);
    expect(parseBooleanValue("   ")).toBe(undefined);
  });

  it("parses default truthy values", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("TRUE")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
  });

  it("parses default falsy values", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("FALSE")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
  });

  it("returns undefined for unknown strings", () => {
    expect(parseBooleanValue("maybe")).toBe(undefined);
    expect(parseBooleanValue("2")).toBe(undefined);
  });

  it("uses custom truthy/falsy options", () => {
    expect(parseBooleanValue("yep", { truthy: ["yep"] })).toBe(true);
    expect(parseBooleanValue("nope", { falsy: ["nope"] })).toBe(false);
    expect(parseBooleanValue("true", { truthy: ["yep"] })).toBe(undefined);
  });
});
