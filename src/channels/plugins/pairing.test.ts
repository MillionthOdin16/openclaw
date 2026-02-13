import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  listPairingChannels,
  getPairingAdapter,
  requirePairingAdapter,
  resolvePairingChannel,
  notifyPairingApproved,
} from "./pairing.js";
import { setActivePluginRegistry } from "../../plugins/runtime.js";
import type { PluginRegistry } from "../../plugins/registry.js";
import type { ChannelPlugin } from "./types.js";
import type { OpenClawConfig } from "../../config/config.js";

describe("channels/plugins/pairing", () => {
  const pairingAdapter = {
    idLabel: "Test ID",
    notifyApproval: vi.fn(),
  };

  const channelWithPairing: ChannelPlugin = {
    id: "test-pairing",
    meta: {
      id: "test-pairing",
      label: "Test Pairing",
      blurb: "Test Pairing",
    },
    capabilities: {},
    config: {
      listAccountIds: () => [],
      resolveAccount: () => ({}),
    },
    pairing: pairingAdapter,
  };

  const channelWithoutPairing: ChannelPlugin = {
    id: "test-no-pairing",
    meta: {
      id: "test-no-pairing",
      label: "Test No Pairing",
      blurb: "Test No Pairing",
    },
    capabilities: {},
    config: {
      listAccountIds: () => [],
      resolveAccount: () => ({}),
    },
  };

  const mockRegistry = {
    channels: [
      {
        pluginId: "test-plugin",
        plugin: channelWithPairing,
        source: "test",
      },
      {
        pluginId: "test-plugin-2",
        plugin: channelWithoutPairing,
        source: "test",
      },
    ],
  } as unknown as PluginRegistry;

  beforeEach(() => {
    setActivePluginRegistry(mockRegistry);
    vi.clearAllMocks();
  });

  afterEach(() => {
    setActivePluginRegistry(null as any);
  });

  describe("listPairingChannels", () => {
    it("should return only channels with pairing adapters", () => {
      const result = listPairingChannels();
      expect(result).toEqual(["test-pairing"]);
    });
  });

  describe("getPairingAdapter", () => {
    it("should return the adapter for a channel with pairing support", () => {
      const result = getPairingAdapter("test-pairing");
      expect(result).toBe(pairingAdapter);
    });

    it("should return null for a channel without pairing support", () => {
      const result = getPairingAdapter("test-no-pairing");
      expect(result).toBeNull();
    });

    it("should return null for a non-existent channel", () => {
      const result = getPairingAdapter("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("requirePairingAdapter", () => {
    it("should return the adapter when found", () => {
      const result = requirePairingAdapter("test-pairing");
      expect(result).toBe(pairingAdapter);
    });

    it("should throw when adapter is not found", () => {
      expect(() => requirePairingAdapter("test-no-pairing")).toThrow(
        "Channel test-no-pairing does not support pairing",
      );
    });
  });

  describe("resolvePairingChannel", () => {
    it("should resolve a valid pairing channel", () => {
      const result = resolvePairingChannel("test-pairing");
      expect(result).toBe("test-pairing");
    });

    it("should be case-insensitive", () => {
      const result = resolvePairingChannel("TEST-PAIRING");
      expect(result).toBe("test-pairing");
    });

    it("should throw for a channel without pairing support", () => {
      expect(() => resolvePairingChannel("test-no-pairing")).toThrow(
        /Invalid channel: test-no-pairing/,
      );
    });

    it("should throw for an invalid channel", () => {
      expect(() => resolvePairingChannel("invalid")).toThrow(/Invalid channel: invalid/);
    });

    it("should throw for empty input", () => {
       expect(() => resolvePairingChannel("")).toThrow(/Invalid channel: \(empty\)/);
       expect(() => resolvePairingChannel(null)).toThrow(/Invalid channel: \(empty\)/);
    });
  });

  describe("notifyPairingApproved", () => {
    const mockConfig = {} as OpenClawConfig;
    const mockRuntime = {} as any;

    it("should call notifyApproval on the adapter", async () => {
      await notifyPairingApproved({
        channelId: "test-pairing",
        id: "user123",
        cfg: mockConfig,
        runtime: mockRuntime,
      });

      expect(pairingAdapter.notifyApproval).toHaveBeenCalledWith({
        cfg: mockConfig,
        id: "user123",
        runtime: mockRuntime,
      });
    });

    it("should use provided pairingAdapter if supplied", async () => {
      const customAdapter = {
        idLabel: "Custom",
        notifyApproval: vi.fn(),
      };

      await notifyPairingApproved({
        channelId: "test-pairing",
        id: "user123",
        cfg: mockConfig,
        runtime: mockRuntime,
        pairingAdapter: customAdapter,
      });

      expect(customAdapter.notifyApproval).toHaveBeenCalledWith({
        cfg: mockConfig,
        id: "user123",
        runtime: mockRuntime,
      });
      expect(pairingAdapter.notifyApproval).not.toHaveBeenCalled();
    });

    it("should handle adapters without notifyApproval", async () => {
        const adapterNoNotify = { idLabel: "NoNotify" };
        const channelNoNotify: ChannelPlugin = {
            ...channelWithPairing,
            id: "test-no-notify",
            pairing: adapterNoNotify
        };

        const registry = {
            channels: [
                {
                    pluginId: "test-plugin-3",
                    plugin: channelNoNotify,
                    source: "test",
                }
            ]
        } as unknown as PluginRegistry;

        setActivePluginRegistry(registry);

        await notifyPairingApproved({
            channelId: "test-no-notify",
            id: "user123",
            cfg: mockConfig
        });

        // Should not throw and finish execution
    });
  });
});
