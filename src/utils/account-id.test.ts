import { describe, expect, it } from "vitest";
import { normalizeAccountId } from "./account-id.js";

describe("normalizeAccountId", () => {
  it("normalizes an account ID to lowercase", () => {
    expect(normalizeAccountId("U123ABC")).toBe("u123abc");
    expect(normalizeAccountId("User@Example.Com")).toBe("user-example-com");
  });

  it("trims whitespace", () => {
    expect(normalizeAccountId("  user123  ")).toBe("user123");
    expect(normalizeAccountId("\tUSER\n")).toBe("user");
  });

  it("returns undefined for empty or missing values", () => {
    expect(normalizeAccountId()).toBeUndefined();
    expect(normalizeAccountId("")).toBeUndefined();
    expect(normalizeAccountId("   ")).toBeUndefined();
  });
});
