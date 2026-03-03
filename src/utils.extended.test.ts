import { describe, expect, it } from "vitest";
import { isSelfChatMode, jidToE164, sliceUtf16Safe, truncateUtf16Safe } from "./utils.js";

describe("jidToE164 (extended)", () => {
  it("returns null for non-numeric @lid (fails strict regex validation)", () => {
    // Documenting the gap where non-numeric LIDs cause the regex to fail
    // and no reverse mapping lookup is attempted.
    expect(jidToE164("test@lid")).toBeNull();
  });
});

describe("isSelfChatMode", () => {
  it("returns false if selfE164 is null or undefined", () => {
    expect(isSelfChatMode(null, ["+123"])).toBe(false);
    expect(isSelfChatMode(undefined, ["+123"])).toBe(false);
  });

  it("returns false if allowFrom is empty or undefined", () => {
    expect(isSelfChatMode("+123", undefined)).toBe(false);
    expect(isSelfChatMode("+123", [])).toBe(false);
  });

  it("returns false if allowFrom only contains '*'", () => {
    expect(isSelfChatMode("+123", ["*"])).toBe(false);
    expect(isSelfChatMode("+123", ["*", "+456"])).toBe(false);
  });

  it("returns true for matching E164 normalized values", () => {
    expect(isSelfChatMode("+123", ["+123"])).toBe(true);
    expect(isSelfChatMode("+123", ["123"])).toBe(true);
    expect(isSelfChatMode("123", ["+123"])).toBe(true);
  });

  it("returns false for non-matching E164 normalized values", () => {
    expect(isSelfChatMode("+123", ["+456", "789"])).toBe(false);
  });

  it("ignores non-parseable values gracefully", () => {
    // If an item in allowFrom cannot be normalized, it's skipped
    expect(isSelfChatMode("+123", ["invalid", "+123"])).toBe(true);
  });
});

describe("truncateUtf16Safe", () => {
  it("truncates strings normally when within bounds", () => {
    expect(truncateUtf16Safe("hello", 3)).toBe("hel");
    expect(truncateUtf16Safe("hello", 0)).toBe("");
  });

  it("returns the original string if length is less than or equal to maxLen", () => {
    expect(truncateUtf16Safe("hello", 5)).toBe("hello");
    expect(truncateUtf16Safe("hello", 10)).toBe("hello");
  });

  it("adjusts maxLen cleanly when falling inside a surrogate pair", () => {
    const thumbs = "👍👍"; // length 4
    // Slicing at maxLen 3 falls inside the second thumbs up.
    // truncateUtf16Safe calls sliceUtf16Safe, which adjusts the end bound backward.
    expect(truncateUtf16Safe(thumbs, 3)).toBe("👍");
  });

  it("handles negative lengths by returning empty string", () => {
    // Math.max(0, limit) ensures negative lengths become 0
    expect(truncateUtf16Safe("hello", -5)).toBe("");
  });
});

describe("sliceUtf16Safe", () => {
  it("slices normal strings correctly", () => {
    expect(sliceUtf16Safe("hello", 1, 4)).toBe("ell");
    expect(sliceUtf16Safe("hello", 0)).toBe("hello");
  });

  it("handles negative indices correctly", () => {
    expect(sliceUtf16Safe("hello", -2)).toBe("lo");
    expect(sliceUtf16Safe("hello", -4, -1)).toBe("ell");
  });

  it("handles out of bounds indices gracefully", () => {
    expect(sliceUtf16Safe("hello", 0, 100)).toBe("hello");
    expect(sliceUtf16Safe("hello", -100, 2)).toBe("he");
  });

  it("handles inverted indices by swapping them", () => {
    // start=4, end=1 -> swapped to start=1, end=4
    expect(sliceUtf16Safe("hello", 4, 1)).toBe("ell");
  });

  it("adjusts boundaries to not break surrogate pairs", () => {
    // "👍" is 2 code units: \uD83D\uDC4D
    const thumbs = "👍👍"; // length 4
    // Attempting to slice in the middle of the first surrogate pair (index 1)
    // implementation moves `from` forward by 1 if it lands on a low surrogate.
    expect(sliceUtf16Safe(thumbs, 1, 4)).toBe("👍");

    // Attempting to end the slice in the middle of a surrogate pair
    // implementation moves `to` backward by 1 if it lands on a low surrogate.
    expect(sliceUtf16Safe(thumbs, 0, 3)).toBe("👍");
  });
});
