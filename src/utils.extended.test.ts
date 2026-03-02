import { describe, expect, it } from "vitest";
import { isSelfChatMode, sliceUtf16Safe, truncateUtf16Safe } from "./utils.js";

describe("isSelfChatMode", () => {
  it("returns false if selfE164 is null or undefined", () => {
    expect(isSelfChatMode(null, ["+15551234567"])).toBe(false);
    expect(isSelfChatMode(undefined, ["+15551234567"])).toBe(false);
    expect(isSelfChatMode("", ["+15551234567"])).toBe(false);
  });

  it("returns false if allowFrom is missing, empty, or not an array", () => {
    expect(isSelfChatMode("+15551234567")).toBe(false);
    expect(isSelfChatMode("+15551234567", null)).toBe(false);
    expect(isSelfChatMode("+15551234567", [])).toBe(false);
    expect(isSelfChatMode("+15551234567", {} as any)).toBe(false);
  });

  it("returns false when a wildcard '*' is present but no exact match exists", () => {
    expect(isSelfChatMode("+15551234567", ["*"])).toBe(false);
    expect(isSelfChatMode("+15551234567", ["+15559999999", "*"])).toBe(false);
  });

  it("returns true when selfE164 exists in allowFrom array", () => {
    expect(isSelfChatMode("+15551234567", ["+15551234567"])).toBe(true);
    expect(isSelfChatMode("+15551234567", ["+15559999999", "+15551234567"])).toBe(true);
  });

  it("normalizes both sides to match", () => {
    expect(isSelfChatMode("15551234567", ["+15551234567"])).toBe(true);
    expect(isSelfChatMode("+15551234567", ["15551234567"])).toBe(true);
    expect(isSelfChatMode("whatsapp:+15551234567", ["15551234567"])).toBe(true);
  });

  it("handles numbers correctly instead of strings in allowFrom", () => {
    expect(isSelfChatMode("+15551234567", [15551234567])).toBe(true);
    expect(isSelfChatMode("+15551234567", [15559999999, 15551234567])).toBe(true);
  });

  it("returns false for unparseable allowFrom entries safely", () => {
    expect(isSelfChatMode("+15551234567", ["invalid-number"])).toBe(false);
  });
});

describe("sliceUtf16Safe", () => {
  it("slices regular ASCII strings like String.slice", () => {
    expect(sliceUtf16Safe("hello world", 0, 5)).toBe("hello");
    expect(sliceUtf16Safe("hello world", 6)).toBe("world");
    expect(sliceUtf16Safe("hello world", -5)).toBe("world");
  });

  it("safely expands slice when start splits a surrogate pair", () => {
    const text = "a🚀b"; // length is 4: 'a', High(🚀), Low(🚀), 'b'
    // Starting at index 2 (Low surrogate of 🚀) should shift start forward to index 3 ('b')
    expect(sliceUtf16Safe(text, 2, 4)).toBe("b");
    // This leaves the emoji out.
  });

  it("safely retracts slice when end splits a surrogate pair", () => {
    const text = "a🚀b"; // length is 4: 'a', High(🚀), Low(🚀), 'b'
    // Ending at index 2 (Low surrogate of 🚀) should shift end backward to index 1 (before 🚀)
    expect(sliceUtf16Safe(text, 0, 2)).toBe("a");
    // This leaves the emoji out.
  });

  it("safely captures entire emoji when slice boundaries cover it", () => {
    const text = "a🚀b";
    expect(sliceUtf16Safe(text, 1, 3)).toBe("🚀");
  });

  it("handles negative indices safely with surrogate pairs", () => {
    const text = "a🚀b"; // length is 4
    // start=-2 is index 2. End is 4. Same as above, should shift start to 3.
    expect(sliceUtf16Safe(text, -2)).toBe("b");
    // end=-2 is index 2. start=0. Should shift end to 1.
    expect(sliceUtf16Safe(text, 0, -2)).toBe("a");
  });

  it("handles end < start by swapping", () => {
    expect(sliceUtf16Safe("hello", 4, 1)).toBe("ell");
  });

  it("safely handles surrogate pair splits when swapped", () => {
    const text = "a🚀b";
    // 4 to 2 will swap to 2 to 4, then start shifts from 2 to 3.
    expect(sliceUtf16Safe(text, 4, 2)).toBe("b");
  });
});

describe("truncateUtf16Safe", () => {
  it("returns original string if length is within maxLen", () => {
    expect(truncateUtf16Safe("hello", 10)).toBe("hello");
    expect(truncateUtf16Safe("hello", 5)).toBe("hello");
  });

  it("truncates ASCII string to exact length", () => {
    expect(truncateUtf16Safe("hello world", 5)).toBe("hello");
  });

  it("safely retracts truncation when maxLen splits a surrogate pair", () => {
    const text = "a🚀b"; // length 4
    // Truncating at 2 splits the emoji. sliceUtf16Safe should retract end to 1.
    expect(truncateUtf16Safe(text, 2)).toBe("a");
  });

  it("safely includes emoji when maxLen covers the full pair", () => {
    const text = "a🚀b"; // length 4
    expect(truncateUtf16Safe(text, 3)).toBe("a🚀");
  });

  it("handles decimal maxLen by flooring it", () => {
    expect(truncateUtf16Safe("hello", 3.7)).toBe("hel");
  });

  it("handles negative maxLen safely by clamping to 0", () => {
    expect(truncateUtf16Safe("hello", -5)).toBe("");
  });
});