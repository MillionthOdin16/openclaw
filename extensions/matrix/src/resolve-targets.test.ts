import type { ChannelDirectoryEntry } from "openclaw/plugin-sdk";
import { describe, expect, it, vi, beforeEach } from "vitest";
const listMatrixDirectoryPeersLiveMock = vi.hoisted(() => vi.fn());
const listMatrixDirectoryGroupsLiveMock = vi.hoisted(() => vi.fn());

vi.mock("./directory-live.js", () => ({
  listMatrixDirectoryPeersLive: listMatrixDirectoryPeersLiveMock,
  listMatrixDirectoryGroupsLive: listMatrixDirectoryGroupsLiveMock,
}));

import { resolveMatrixTargets } from "./resolve-targets.js";

describe("resolveMatrixTargets (users)", () => {
  beforeEach(() => {
    listMatrixDirectoryPeersLiveMock.mockReset();
  });

  it("resolves exact unique display name matches", async () => {
    const matches: ChannelDirectoryEntry[] = [
      { kind: "user", id: "@alice:example.org", name: "Alice" },
    ];
    listMatrixDirectoryPeersLiveMock.mockResolvedValue(matches);

    const [result] = await resolveMatrixTargets({
      cfg: {},
      inputs: ["Alice"],
      kind: "user",
    });

    expect(result?.resolved).toBe(true);
    expect(result?.id).toBe("@alice:example.org");
  });

  it("does not resolve ambiguous or non-exact matches", async () => {
    const matches: ChannelDirectoryEntry[] = [
      { kind: "user", id: "@alice:example.org", name: "Alice" },
      { kind: "user", id: "@alice:evil.example", name: "Alice" },
    ];
    listMatrixDirectoryPeersLiveMock.mockResolvedValue(matches);

    const [result] = await resolveMatrixTargets({
      cfg: {},
      inputs: ["Alice"],
      kind: "user",
    });

    expect(result?.resolved).toBe(false);
    expect(result?.note).toMatch(/use full Matrix ID/i);
  });
});
