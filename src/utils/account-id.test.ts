import { describe, expect, it, vi } from "vitest";
import * as routingAccountId from "../routing/account-id.js";
import { normalizeAccountId } from "./account-id.js";

vi.mock("../routing/account-id.js", () => ({
  normalizeOptionalAccountId: vi.fn((val) => (val === "test" ? "normalized-test" : undefined)),
}));

describe("normalizeAccountId", () => {
  it("should call normalizeOptionalAccountId and return its result", () => {
    expect(normalizeAccountId("test")).toBe("normalized-test");
    expect(routingAccountId.normalizeOptionalAccountId).toHaveBeenCalledWith("test");

    expect(normalizeAccountId("invalid")).toBeUndefined();
    expect(routingAccountId.normalizeOptionalAccountId).toHaveBeenCalledWith("invalid");
  });
});
