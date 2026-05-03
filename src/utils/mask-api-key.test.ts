import { describe, expect, it } from "vitest";
import { maskApiKey } from "./mask-api-key.js";

describe("maskApiKey", () => {
  it("should return 'missing' for empty or whitespace strings", () => {
    expect(maskApiKey("")).toBe("missing");
    expect(maskApiKey("   ")).toBe("missing");
  });

  it("should mask strings with length <= 6", () => {
    expect(maskApiKey("abcdef")).toBe("a...f");
    expect(maskApiKey("ab")).toBe("a...b");
  });

  it("should mask strings with length between 7 and 16", () => {
    expect(maskApiKey("abcdefghijklmno")).toBe("ab...no");
    expect(maskApiKey("abcdefg")).toBe("ab...fg");
  });

  it("should mask strings with length > 16", () => {
    expect(maskApiKey("abcdefghijklmnopqrstuvwxyz")).toBe("abcdefgh...stuvwxyz");
    expect(maskApiKey("12345678901234567")).toBe("12345678...01234567");
  });
});
