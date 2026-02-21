import { describe, expect, it } from "vitest";
import { sliceUtf16Safe, truncateUtf16Safe } from "../utils.js";

describe("sliceUtf16Safe", () => {
  it("handles basic ASCII slicing", () => {
    const input = "Hello World";
    expect(sliceUtf16Safe(input, 0, 5)).toBe("Hello");
    expect(sliceUtf16Safe(input, 6)).toBe("World");
    expect(sliceUtf16Safe(input, 0)).toBe("Hello World");
  });

  it("handles empty strings", () => {
    expect(sliceUtf16Safe("", 0, 5)).toBe("");
  });

  it("handles out of bounds indices", () => {
    const input = "abc";
    expect(sliceUtf16Safe(input, 0, 10)).toBe("abc");
    expect(sliceUtf16Safe(input, 10, 20)).toBe("");
  });

  it("handles negative indices", () => {
    const input = "abcdef";
    expect(sliceUtf16Safe(input, -3)).toBe("def");
    expect(sliceUtf16Safe(input, -3, -1)).toBe("de");
  });

  it("swaps start and end if start > end", () => {
    const input = "abcdef";
    // standard slice returns empty string, sliceUtf16Safe swaps
    expect(sliceUtf16Safe(input, 3, 1)).toBe("bc");
  });

  it("handles multi-byte characters (emojis)", () => {
    const pileOfPoo = "💩"; // \uD83D\uDCA9
    const rocket = "🚀";   // \uD83D\uDE80
    const input = `A${pileOfPoo}B${rocket}C`;

    // Normal slicing around emojis
    expect(sliceUtf16Safe(input, 0, 1)).toBe("A");
    expect(sliceUtf16Safe(input, 1, 3)).toBe(pileOfPoo); // Length 2
    expect(sliceUtf16Safe(input, 3, 4)).toBe("B");
  });

  it("prevents splitting surrogate pairs at the start", () => {
    const pileOfPoo = "💩"; // \uD83D\uDCA9
    // "A" + High + Low + "B"
    //  0    1      2     3
    const input = `A${pileOfPoo}B`;

    // Attempt to start slice at index 2 (Low surrogate)
    // Should advance start to 3 ("B") to avoid orphan Low
    expect(sliceUtf16Safe(input, 2)).toBe("B");
  });

  it("prevents splitting surrogate pairs at the end", () => {
    const pileOfPoo = "💩"; // \uD83D\uDCA9
    // "A" + High + Low + "B"
    //  0    1      2     3
    const input = `A${pileOfPoo}B`;

    // Attempt to end slice at index 2 (Low surrogate)
    // Should retreat end to 1 ("A") to avoid orphan High
    expect(sliceUtf16Safe(input, 0, 2)).toBe("A");
  });
});

describe("truncateUtf16Safe", () => {
  it("truncates ASCII strings correctly", () => {
    expect(truncateUtf16Safe("Hello World", 5)).toBe("Hello");
  });

  it("truncates at surrogate pair boundary safely", () => {
     const pileOfPoo = "💩"; // Length 2
     // "A" + High + Low + "B"
     const input = `A${pileOfPoo}B`;

     // Limit 2: "A" + High. Should drop High -> "A"
     expect(truncateUtf16Safe(input, 2)).toBe("A");

     // Limit 3: "A" + Poo.
     expect(truncateUtf16Safe(input, 3)).toBe(`A${pileOfPoo}`);
  });
});
