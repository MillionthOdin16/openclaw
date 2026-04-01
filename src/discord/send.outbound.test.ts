import { describe, expect, it, vi, beforeEach } from "vitest";
import { resolveFetch } from "../infra/fetch.js";
import { sendMessageDiscord } from "./send.outbound.js";

vi.mock("../infra/fetch.js", () => ({
  resolveFetch: vi.fn(),
}));

describe("sendMessageDiscord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles webhook response safely without json throwing on 503", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "Service Unavailable",
      json: async () => {
        throw new Error("Unexpected token S in JSON");
      },
    });
    vi.mocked(resolveFetch).mockReturnValue(mockFetch);

    await expect(sendMessageDiscord("webhook:123:abc", "hello", { token: "t" })).rejects.toThrow(
      "Discord webhook send failed (503: Service Unavailable)",
    );
  });
});
