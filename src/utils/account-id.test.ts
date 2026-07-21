import { describe, expect, it, vi } from "vitest";
import { normalizeAccountId } from "./account-id.js";
import * as routingAccountId from "../routing/account-id.js";

vi.mock("../routing/account-id.js", () => ({
  normalizeOptionalAccountId: vi.fn((val) => val ? `normalized-${val}` : undefined),
}));

describe("normalizeAccountId", () => {
  it("should call normalizeOptionalAccountId with the value", () => {
    expect(normalizeAccountId("test-id")).toBe("normalized-test-id");
    expect(routingAccountId.normalizeOptionalAccountId).toHaveBeenCalledWith("test-id");
  });

  it("should return undefined if value is undefined", () => {
    expect(normalizeAccountId()).toBeUndefined();
    expect(routingAccountId.normalizeOptionalAccountId).toHaveBeenCalledWith(undefined);
  });
});
