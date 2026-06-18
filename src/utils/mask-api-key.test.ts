import { describe, expect, it } from "vitest";
import { maskApiKey } from "./mask-api-key.js";

describe("maskApiKey", () => {
  it('should return "missing" for empty or whitespace-only strings', () => {
    expect(maskApiKey("")).toBe("missing");
    expect(maskApiKey("   ")).toBe("missing");
  });

  it("should mask very short strings (<= 6 chars) by showing 1 char at each end", () => {
    expect(maskApiKey("abcdef")).toBe("a...f");
    expect(maskApiKey("ab")).toBe("a...b");
    expect(maskApiKey("a")).toBe("a...a");
  });

  it("should mask short strings (> 6 and <= 16 chars) by showing 2 chars at each end", () => {
    expect(maskApiKey("abcdefg")).toBe("ab...fg");
    expect(maskApiKey("abcdefghijklmnop")).toBe("ab...op"); // exactly 16
  });

  it("should mask long strings (> 16 chars) by showing 8 chars at each end", () => {
    expect(maskApiKey("1234567890abcdefghijklmnopqrstuvwxyz")).toBe("12345678...stuvwxyz");
  });

  it("should trim strings before masking", () => {
    expect(maskApiKey("  abcdefg  ")).toBe("ab...fg");
  });
});
