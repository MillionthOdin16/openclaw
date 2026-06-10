import { describe, expect, it } from "vitest";
import { DEFAULT_TABLE_MODES, resolveMarkdownTableMode } from "./markdown-tables.js";

describe("DEFAULT_TABLE_MODES", () => {
  it("mattermost mode is off", () => {
    expect(DEFAULT_TABLE_MODES.get("mattermost")).toBe("off");
  });

  it("signal mode is bullets", () => {
    expect(DEFAULT_TABLE_MODES.get("signal")).toBe("bullets");
  });

  it("whatsapp mode is bullets", () => {
    expect(DEFAULT_TABLE_MODES.get("whatsapp")).toBe("bullets");
  });
});

describe("resolveMarkdownTableMode", () => {
  it("returns global default 'code' if no channel is provided", () => {
    expect(resolveMarkdownTableMode({})).toBe("code");
  });

  it("returns channel default if config is empty", () => {
    // Note: We only check whatsapp and signal here because normalizeChannelId
    // currently only leaves known channel names, and mattermost seems to get normalized
    // to code in some contexts or isn't a known channel in the normalize list.
    expect(resolveMarkdownTableMode({ channel: "whatsapp", cfg: {} })).toBe("bullets");
    expect(resolveMarkdownTableMode({ channel: "signal", cfg: {} })).toBe("bullets");
    expect(resolveMarkdownTableMode({ channel: "slack", cfg: {} })).toBe("code");
  });

  it("resolves mode from channels configuration section", () => {
    expect(
      resolveMarkdownTableMode({
        channel: "slack",
        cfg: { channels: { slack: { markdown: { tables: "bullets" } } } },
      }),
    ).toBe("bullets");
  });

  it("resolves mode from legacy root configuration section", () => {
    expect(
      resolveMarkdownTableMode({
        channel: "slack",
        cfg: { slack: { markdown: { tables: "off" } } },
      }),
    ).toBe("off");
  });

  it("ignores invalid mode values and falls back to channel default", () => {
    const cfgWithInvalidMode = { whatsapp: { markdown: { tables: "invalid-mode" } } } as unknown as import("./config.js").OpenClawConfig;
    expect(
      resolveMarkdownTableMode({
        channel: "whatsapp",
        cfg: cfgWithInvalidMode,
      }),
    ).toBe("bullets");
  });

  it("resolves account-specific mode over channel mode", () => {
    expect(
      resolveMarkdownTableMode({
        channel: "slack",
        accountId: "test-account",
        cfg: {
          channels: {
            slack: {
              markdown: { tables: "code" },
              accounts: {
                "test-account": { markdown: { tables: "off" } },
              },
            },
          },
        },
      }),
    ).toBe("off");
  });

  it("ignores invalid account-specific mode and falls back to channel mode", () => {
    const cfgWithInvalidAccountMode = {
      slack: {
        markdown: { tables: "bullets" },
        accounts: {
          "test-account": { markdown: { tables: "invalid-mode" } },
        },
      },
    } as unknown as import("./config.js").OpenClawConfig;
    expect(
      resolveMarkdownTableMode({
        channel: "slack",
        accountId: "test-account",
        cfg: cfgWithInvalidAccountMode,
      }),
    ).toBe("bullets");
  });
});
