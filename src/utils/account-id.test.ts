import { describe, expect, it } from "vitest";
import { normalizeAccountId } from "./account-id.js";

describe("normalizeAccountId", () => {
  it("should return normalized account ID", () => {
    expect(normalizeAccountId("Test_Account-123")).toBe("test_account-123");
  });

  it("should return undefined for empty or invalid account ID that resolves to empty", () => {
    expect(normalizeAccountId("")).toBeUndefined();
    expect(normalizeAccountId(undefined)).toBeUndefined();
    expect(normalizeAccountId("---")).toBeUndefined();
  });

  it("should normalize prototype keys to undefined", () => {
    expect(normalizeAccountId("__proto__")).toBeUndefined();
    expect(normalizeAccountId("constructor")).toBeUndefined();
  });
});
