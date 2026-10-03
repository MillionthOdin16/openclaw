import { describe, it, expect, vi } from "vitest";
import { normalizeAccountId } from "./account-id.ts";
import * as routingAccountId from "../routing/account-id.ts";

describe("normalizeAccountId", () => {
  it("should delegate to normalizeOptionalAccountId", () => {
    const spy = vi.spyOn(routingAccountId, "normalizeOptionalAccountId").mockReturnValue("normalized");
    expect(normalizeAccountId("raw")).toBe("normalized");
    expect(spy).toHaveBeenCalledWith("raw");
  });
});
