import { describe, expect, it, vi } from "vitest";
import * as routingAccountId from "../routing/account-id.js";
import { normalizeAccountId } from "./account-id.js";

describe("normalizeAccountId", () => {
  it("calls normalizeOptionalAccountId with the given value", () => {
    const spy = vi
      .spyOn(routingAccountId, "normalizeOptionalAccountId")
      .mockReturnValue("normalized");

    expect(normalizeAccountId("raw")).toBe("normalized");
    expect(spy).toHaveBeenCalledWith("raw");

    spy.mockRestore();
  });

  it("handles undefined values", () => {
    const spy = vi.spyOn(routingAccountId, "normalizeOptionalAccountId").mockReturnValue(undefined);

    expect(normalizeAccountId(undefined)).toBeUndefined();
    expect(spy).toHaveBeenCalledWith(undefined);

    spy.mockRestore();
  });
});
