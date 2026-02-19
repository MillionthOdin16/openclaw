import { describe, expect, it } from "vitest";
import { sliceUtf16Safe, truncateUtf16Safe } from "./utils.js";

describe("sliceUtf16Safe", () => {
  const emojiStr = "a😀b😂c"; // 'a' (1), '😀' (2), 'b' (1), '😂' (2), 'c' (1) -> length 7
  // indices: 0: 'a', 1-2: '😀', 3: 'b', 4-5: '😂', 6: 'c'

  it("handles basic ASCII strings correctly", () => {
    expect(sliceUtf16Safe("hello", 0, 5)).toBe("hello");
    expect(sliceUtf16Safe("hello", 1, 4)).toBe("ell");
    expect(sliceUtf16Safe("hello", -2)).toBe("lo");
  });

  it("handles strings with surrogate pairs correctly", () => {
    // Slice "😀" (indices 1-3) -> "😀"
    expect(sliceUtf16Safe(emojiStr, 1, 3)).toBe("😀");
    // Slice "b😂" (indices 3-6) -> "b😂"
    expect(sliceUtf16Safe(emojiStr, 3, 6)).toBe("b😂");
  });

  it("adjusts start index if it falls in the middle of a surrogate pair", () => {
    // Start at index 2 (low surrogate of 😀) -> should move to 3 ('b')
    // Wait, let's trace logic:
    // from = 2. input.charCodeAt(2) is low surrogate? Yes.
    // input.charCodeAt(1) is high surrogate? Yes.
    // from += 1 -> 3.
    // So slice(3, ...) -> starts at 'b'
    expect(sliceUtf16Safe(emojiStr, 2)).toBe("b😂c");
  });

  it("adjusts end index if it falls in the middle of a surrogate pair", () => {
    // End at index 2 (low surrogate of 😀) -> should move to 1 (before 😀)
    // Wait, let's trace logic:
    // to = 2. input.charCodeAt(1) is high surrogate? Yes.
    // input.charCodeAt(2) is low surrogate? Yes.
    // to -= 1 -> 1.
    // So slice(..., 1) -> ends after 'a'
    expect(sliceUtf16Safe(emojiStr, 0, 2)).toBe("a");
  });

  it("handles split surrogate pair at both ends", () => {
    // Start at 2 (middle of 😀), End at 5 (middle of 😂)
    // Start 2 -> becomes 3 ('b')
    // End 5 -> becomes 4 (before 😂)
    // Result: "b"
    expect(sliceUtf16Safe(emojiStr, 2, 5)).toBe("b");
  });

  it("handles edge cases", () => {
    expect(sliceUtf16Safe("", 0, 5)).toBe("");
    // Note: sliceUtf16Safe swaps indices if start > end, similar to substring but supports negative indices
    expect(sliceUtf16Safe("abc", 5, 1)).toBe("bc");
  });
});

describe("truncateUtf16Safe", () => {
  const emojiStr = "a😀b😂c"; // length 7

  it("returns original string if length is within limit", () => {
    expect(truncateUtf16Safe(emojiStr, 7)).toBe(emojiStr);
    expect(truncateUtf16Safe(emojiStr, 10)).toBe(emojiStr);
  });

  it("truncates basic strings", () => {
    expect(truncateUtf16Safe("hello", 3)).toBe("hel");
  });

  it("truncates at surrogate boundary safely", () => {
    // "a😀" is length 3. Limit 2.
    // slice(0, 2). End 2 is middle of 😀.
    // sliceUtf16Safe moves end to 1.
    // Result "a"
    expect(truncateUtf16Safe("a😀", 2)).toBe("a");
  });

  it("truncates correctly when limit lands exactly after surrogate", () => {
    // "a😀" is length 3. Limit 3.
    // slice(0, 3) -> "a😀"
    expect(truncateUtf16Safe("a😀", 3)).toBe("a😀");
  });

  it("handles zero or negative limits", () => {
    expect(truncateUtf16Safe("hello", 0)).toBe("");
    expect(truncateUtf16Safe("hello", -5)).toBe("");
  });
});
