import { describe, expect, it } from "vitest";
import { isSelfChatMode, sliceUtf16Safe, truncateUtf16Safe } from "./utils.js";

describe("isSelfChatMode", () => {
  it("returns false if selfE164 is missing, null, or undefined", () => {
    expect(isSelfChatMode(null, ["+1234567890"])).toBe(false);
    expect(isSelfChatMode(undefined, ["+1234567890"])).toBe(false);
    expect(isSelfChatMode("", ["+1234567890"])).toBe(false);
  });

  it("returns false if allowFrom is missing, null, undefined, or empty", () => {
    expect(isSelfChatMode("+1234567890", null)).toBe(false);
    expect(isSelfChatMode("+1234567890", undefined)).toBe(false);
    expect(isSelfChatMode("+1234567890", [])).toBe(false);
  });

  it("returns true if selfE164 exactly matches an entry in allowFrom", () => {
    expect(isSelfChatMode("+1234567890", ["+1234567890"])).toBe(true);
    expect(isSelfChatMode("+1234567890", ["+0987654321", "+1234567890"])).toBe(true);
  });

  it("returns true if selfE164 matches an entry in allowFrom after formatting via normalizeE164", () => {
    // normalizeE164 strips non-digits and leading "whatsapp:", then adds "+"
    expect(isSelfChatMode("+1234567890", ["whatsapp:+1234567890"])).toBe(true);
    expect(isSelfChatMode("whatsapp:+1234567890", ["+1234567890"])).toBe(true);
    expect(isSelfChatMode("1234567890", ["+1234567890"])).toBe(true);
    expect(isSelfChatMode("+1234567890", [1234567890])).toBe(true);
  });

  it("returns false if allowFrom contains the '*' wildcard", () => {
    expect(isSelfChatMode("+1234567890", ["*"])).toBe(false);
    expect(isSelfChatMode("+1234567890", ["*", "+0987654321"])).toBe(false);
  });

  it("returns false for elements in allowFrom where normalizeE164 throws or is invalid", () => {
    // In our implementation, normalizeE164 might not strictly throw on every invalid string,
    // but the try/catch protects against potential errors (e.g. from String(n)).
    // A non-numeric string will not match selfE164 anyway.
    expect(isSelfChatMode("+1234567890", ["invalid", "+0987654321"])).toBe(false);

    // We can simulate an object that throws on string conversion
    const throwingObj = {
      toString: () => {
        throw new Error("Conversion error");
      }
    };
    // The try/catch in isSelfChatMode should swallow the error and continue returning false for that element.
    expect(isSelfChatMode("+1234567890", [throwingObj as any])).toBe(false);
  });
});

describe("sliceUtf16Safe", () => {
  it("slices a standard string correctly", () => {
    expect(sliceUtf16Safe("hello world", 0, 5)).toBe("hello");
    expect(sliceUtf16Safe("hello world", 6)).toBe("world");
  });

  it("handles negative indices properly by calculating offset from string length", () => {
    expect(sliceUtf16Safe("hello world", -5)).toBe("world");
    expect(sliceUtf16Safe("hello world", 0, -6)).toBe("hello");
    expect(sliceUtf16Safe("hello world", -5, -2)).toBe("wor");
    // Beyond bounds limits to 0
    expect(sliceUtf16Safe("hello", -10, 2)).toBe("he");
  });

  it("handles an undefined end parameter by defaulting to string length", () => {
    expect(sliceUtf16Safe("hello", 2, undefined)).toBe("llo");
  });

  it("swaps from and to if to is less than from", () => {
    expect(sliceUtf16Safe("hello", 5, 0)).toBe("hello");
    expect(sliceUtf16Safe("hello", 4, 1)).toBe("ell");
  });

  it("avoids splitting a surrogate pair at the start bound", () => {
    // 🌍 is represented by a surrogate pair (length 2).
    // The high surrogate is at index 0, low surrogate at index 1.
    const str = "🌍hello"; // length is 2 + 5 = 7
    // If start is 1, it lands on the low surrogate. It should move forward to 2.
    expect(sliceUtf16Safe(str, 1)).toBe("hello");
  });

  it("avoids splitting a surrogate pair at the end bound", () => {
    const str = "hello🌍"; // length is 5 + 2 = 7
    // If end is 6, it lands on the low surrogate (the high surrogate is at 5).
    // The logic: if `to` lands on a low surrogate and `to - 1` is a high surrogate,
    // it moves `to` backward to `to - 1`.
    expect(sliceUtf16Safe(str, 0, 6)).toBe("hello");
  });

  it("handles strings with multiple surrogate pairs correctly", () => {
    const str = "👩‍🚀🚀✨"; // Note: 👩‍🚀 uses zero-width joiners so it's a complex sequence, but we are testing UTF-16 surrogates.
    // Let's use simpler surrogate pairs
    const emojis = "🌍🌎🌏"; // Length 6. Highs at 0, 2, 4. Lows at 1, 3, 5.

    // Slicing starting from index 3 (low surrogate of 🌎). Moves to 4.
    expect(sliceUtf16Safe(emojis, 3)).toBe("🌏");

    // Slicing ending at 3 (low surrogate of 🌎). Moves end to 2.
    expect(sliceUtf16Safe(emojis, 0, 3)).toBe("🌍");
  });
});

describe("truncateUtf16Safe", () => {
  it("returns original string if length is less than or equal to Math.max(0, Math.floor(maxLen))", () => {
    expect(truncateUtf16Safe("hello", 5)).toBe("hello");
    expect(truncateUtf16Safe("hello", 10)).toBe("hello");
  });

  it("truncates standard strings correctly", () => {
    expect(truncateUtf16Safe("hello world", 5)).toBe("hello");
  });

  it("floors maxLen if it is a float", () => {
    expect(truncateUtf16Safe("hello world", 5.9)).toBe("hello");
  });

  it("clamps negative maxLen to 0", () => {
    expect(truncateUtf16Safe("hello", -5)).toBe("");
  });

  it("delegates to sliceUtf16Safe and respects surrogate boundaries", () => {
    const emojis = "🌍🌎🌏"; // Length 6. Indexes: 0+1, 2+3, 4+5
    // If we limit to 3, maxLen is 3. `sliceUtf16Safe(input, 0, 3)` will adjust `to` from 3 to 2.
    // Thus returning "🌍".
    expect(truncateUtf16Safe(emojis, 3)).toBe("🌍");
    // Limit to 4 returns first two emojis.
    expect(truncateUtf16Safe(emojis, 4)).toBe("🌍🌎");
  });
});
