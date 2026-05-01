import { describe, expect, it } from "vitest";
import { parseBooleanValue } from "./boolean.js";

describe("parseBooleanValue", () => {
  it("should return the boolean directly if input is already boolean", () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("should return undefined for non-string inputs", () => {
    expect(parseBooleanValue(123)).toBe(undefined);
    expect(parseBooleanValue({})).toBe(undefined);
    expect(parseBooleanValue(null)).toBe(undefined);
    expect(parseBooleanValue(undefined)).toBe(undefined);
  });

  it("should return undefined for empty or whitespace strings", () => {
    expect(parseBooleanValue("")).toBe(undefined);
    expect(parseBooleanValue("   ")).toBe(undefined);
  });

  describe("with default options", () => {
    it("should parse default truthy strings", () => {
      expect(parseBooleanValue("true")).toBe(true);
      expect(parseBooleanValue("1")).toBe(true);
      expect(parseBooleanValue("yes")).toBe(true);
      expect(parseBooleanValue("on")).toBe(true);

      // Case insensitivity and whitespace handling
      expect(parseBooleanValue(" TRUE ")).toBe(true);
      expect(parseBooleanValue("Yes")).toBe(true);
    });

    it("should parse default falsy strings", () => {
      expect(parseBooleanValue("false")).toBe(false);
      expect(parseBooleanValue("0")).toBe(false);
      expect(parseBooleanValue("no")).toBe(false);
      expect(parseBooleanValue("off")).toBe(false);

      // Case insensitivity and whitespace handling
      expect(parseBooleanValue(" FALSE ")).toBe(false);
      expect(parseBooleanValue("No")).toBe(false);
    });

    it("should return undefined for unrecognized strings", () => {
      expect(parseBooleanValue("maybe")).toBe(undefined);
      expect(parseBooleanValue("unknown")).toBe(undefined);
    });
  });

  describe("with custom options", () => {
    it("should use custom truthy and falsy arrays", () => {
      const options = {
        truthy: ["yep", "sure"],
        falsy: ["nope", "nah"]
      };

      expect(parseBooleanValue("yep", options)).toBe(true);
      expect(parseBooleanValue("sure", options)).toBe(true);
      expect(parseBooleanValue("nope", options)).toBe(false);
      expect(parseBooleanValue("nah", options)).toBe(false);

      // Defaults shouldn't work anymore if overridden
      expect(parseBooleanValue("true", options)).toBe(undefined);
      expect(parseBooleanValue("false", options)).toBe(undefined);
    });

    it("should handle partial overrides", () => {
      const truthyOptions = { truthy: ["yep"] };
      expect(parseBooleanValue("yep", truthyOptions)).toBe(true);
      expect(parseBooleanValue("false", truthyOptions)).toBe(false); // default falsy still works
      expect(parseBooleanValue("true", truthyOptions)).toBe(undefined); // default truthy is gone

      const falsyOptions = { falsy: ["nope"] };
      expect(parseBooleanValue("nope", falsyOptions)).toBe(false);
      expect(parseBooleanValue("true", falsyOptions)).toBe(true); // default truthy still works
      expect(parseBooleanValue("false", falsyOptions)).toBe(undefined); // default falsy is gone
    });
  });
});
