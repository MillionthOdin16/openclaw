import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const resolveMatrixAuthMock = vi.hoisted(() => vi.fn());

vi.mock("./matrix/client.js", () => ({
  resolveMatrixAuth: resolveMatrixAuthMock,
}));

import { listMatrixDirectoryGroupsLive, listMatrixDirectoryPeersLive } from "./directory-live.js";

describe("matrix directory live", () => {
  const cfg = { channels: { matrix: {} } };

  beforeEach(() => {
    resolveMatrixAuthMock.mockReset();
    resolveMatrixAuthMock.mockResolvedValue({
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      accessToken: "test-token",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
        text: async () => "",
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("passes accountId to peer directory auth resolution", async () => {
    await listMatrixDirectoryPeersLive({
      cfg,
      accountId: "assistant",
      query: "alice",
      limit: 10,
    });

    expect(resolveMatrixAuthMock).toHaveBeenCalledWith({ cfg, accountId: "assistant" });
  });

  it("passes accountId to group directory auth resolution", async () => {
    await listMatrixDirectoryGroupsLive({
      cfg,
      accountId: "assistant",
      query: "!room:example.org",
      limit: 10,
    });

    expect(resolveMatrixAuthMock).toHaveBeenCalledWith({ cfg, accountId: "assistant" });
  });
});
