import { describe, it, expect } from "vitest";
import { parseByteSize } from "./parse-bytes.js";

describe("parseByteSize", () => {
  it("should parse normal bytes correctly", () => {
    expect(parseByteSize("10b")).toBe(10);
    expect(parseByteSize("10kb")).toBe(10240);
    expect(parseByteSize("10k")).toBe(10240);
    expect(parseByteSize("10mb")).toBe(10485760);
    expect(parseByteSize("10m")).toBe(10485760);
    expect(parseByteSize("10gb")).toBe(10737418240);
    expect(parseByteSize("10g")).toBe(10737418240);
    expect(parseByteSize("10tb")).toBe(10995116277760);
    expect(parseByteSize("10t")).toBe(10995116277760);
  });

  it("should handle floating point numbers", () => {
    expect(parseByteSize("1.5kb")).toBe(1536);
    expect(parseByteSize("1.5mb")).toBe(1572864);
  });

  it("should use default unit if none provided", () => {
    expect(parseByteSize("10")).toBe(10);
    expect(parseByteSize("10", { defaultUnit: "kb" })).toBe(10240);
  });

  it("should ignore whitespace and case", () => {
    expect(parseByteSize("  10KB  ")).toBe(10240);
    expect(parseByteSize("10Kb")).toBe(10240);
  });

  it("should throw error on invalid input", () => {
    expect(() => parseByteSize("")).toThrow("invalid byte size (empty)");
    expect(() => parseByteSize(null as any)).toThrow("invalid byte size (empty)");
    expect(() => parseByteSize(undefined as any)).toThrow("invalid byte size (empty)");
    expect(() => parseByteSize("  ")).toThrow("invalid byte size (empty)");
    expect(() => parseByteSize("abc")).toThrow("invalid byte size: abc");
    expect(() => parseByteSize("-10b")).toThrow("invalid byte size: -10b");
    expect(() => parseByteSize("10xb")).toThrow("invalid byte size unit: 10xb");
    expect(() => parseByteSize("Infinityb")).toThrow("invalid byte size: Infinityb");
    expect(() => parseByteSize("10zb")).toThrow("invalid byte size unit: 10zb");
  });

  it("should throw error when value parses to infinite", () => {
    const huge = "9".repeat(400);
    expect(() => parseByteSize(`${huge}b`)).toThrow(`invalid byte size: ${huge}b`);
  });

  it("should throw error when bytes calculate to infinite", () => {
    // 1e308 * 1024 produces Infinity, so !Number.isFinite(bytes) is true
    // Wait, the regex `^(\d+(?:\.\d+)?)([a-z]+)?$` DOES NOT ALLOW scientific notation (e).
    // Let's use standard digits!
    // A number close to Number.MAX_VALUE in pure digits
    const veryLargeDigitOnly = "1" + "0".repeat(308);
    expect(() => parseByteSize(`${veryLargeDigitOnly}kb`)).toThrow(`invalid byte size: ${veryLargeDigitOnly}kb`);
  });
});
