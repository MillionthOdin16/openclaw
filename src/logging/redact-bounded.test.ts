import { describe, expect, it } from "vitest";
import { replacePatternBounded, REDACT_REGEX_CHUNK_SIZE } from "./redact-bounded.js";

describe("replacePatternBounded", () => {
  it("redacts tokens exactly crossing a chunk boundary", () => {
    const token = "OPENAI_API_KEY=sk-1234567890abcdef";
    const pattern = /OPENAI_API_KEY=sk-[0-9a-f]+/gi;

    // Put the token exactly straddling the boundary of 16384
    const offsetStraddle = REDACT_REGEX_CHUNK_SIZE - 10;
    const input = "x".repeat(offsetStraddle) + token + "y".repeat(REDACT_REGEX_CHUNK_SIZE);

    const redacted = replacePatternBounded(input, pattern, () => "***REDACTED***");

    expect(redacted.includes("sk-1234567890abcdef")).toBe(false);
    expect(redacted).toContain("***REDACTED***");
  });
});
