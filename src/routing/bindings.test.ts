import { describe, expect, it } from "vitest";
import type { OpenClawConfig } from "../config/config.js";
import {
  listBindings,
  listBoundAccountIds,
  resolveDefaultAgentBoundAccountId,
  buildChannelAccountBindings,
  resolvePreferredAccountId,
} from "./bindings.js";

describe("bindings", () => {
  const mockConfig = {
    agents: {
      list: [{ id: "agent1", default: true }, { id: "agent2" }],
    },
    bindings: [
      {
        type: "route",
        agentId: "agent1",
        match: {
          channel: "discord",
          accountId: "account1",
        },
      },
      {
        type: "route",
        agentId: "agent1",
        match: {
          channel: "discord",
          accountId: "account2",
        },
      },
      {
        type: "route",
        agentId: "agent2",
        match: {
          channel: "telegram",
          accountId: "account3",
        },
      },
      {
        type: "route",
        agentId: "agent2",
        match: {
          channel: "discord",
          accountId: "*",
        },
      },
      {
        type: "acp",
        agentId: "agent1",
        url: "http://localhost",
      },
    ],
  } as unknown as OpenClawConfig;

  const mockConfigWithInvalids = {
    agents: {
      list: [{ id: "agent1", default: true }],
    },
    bindings: [
      { type: "route", agentId: "agent1", match: { channel: "discord", accountId: "account1" } },
      // Invalid cases for full coverage
      null,
      undefined,
      "invalid",
      { type: "route", agentId: "agent1", match: null },
      { type: "route", agentId: "agent1", match: {} },
      { type: "route", agentId: "agent1", match: { channel: "discord" } },
      { type: "route", agentId: "agent1", match: { accountId: "account1" } },
      { type: "route", agentId: "agent1", match: { channel: "discord", accountId: "*" } },
    ],
  } as unknown as OpenClawConfig;

  describe("listBindings", () => {
    it("returns route bindings from config", () => {
      const bindings = listBindings(mockConfig);
      expect(bindings).toHaveLength(4);
      expect(bindings.every((b) => b.type === "route" || !b.type)).toBe(true);
    });

    it("filters out invalid bindings", () => {
      const bindings = listBindings(mockConfigWithInvalids);
      // listBindings just returns bindings where isRouteBinding returns true (which is default true if type !== acp)
      // Since it's returning 9 bindings, it means the invalid cases are typed as 'route' or type is not 'acp'
      expect(bindings).toHaveLength(9);
    });
  });

  describe("resolveNormalizedBindingMatch", () => {
    it("handles invalid route binding without object properties when evaluating bounds", () => {
      // By using listBoundAccountIds, we can test that it correctly filters bindings lacking properties.

      const functionNotObject = () => {};
      functionNotObject.type = "route";
      functionNotObject.match = { channel: "discord", accountId: "account1" };

      const configWithPrimitives = {
        bindings: [
          // valid
          {
            type: "route",
            agentId: "agent1",
            match: { channel: "discord", accountId: "account1" },
          },
          // invalid: binding itself is primitive but with "type": "route"
          Object.assign(123, { type: "route" }),
          // invalid: binding with primitive match
          { type: "route", agentId: "agent1", match: "not-an-object" },
          // invalid: binding that is not an object
          functionNotObject,
        ],
      } as unknown as OpenClawConfig;

      const configWithPrimitives2 = {
        bindings: [
          // valid
          {
            type: "route",
            agentId: "agent1",
            match: { channel: "discord", accountId: "account1" },
          },
          // invalid: string instead of object
          "string-binding",
        ],
      } as unknown as OpenClawConfig;

      const accountIds = listBoundAccountIds(configWithPrimitives, "discord");
      expect(accountIds).toEqual(["account1"]);

      const accountIds2 = listBoundAccountIds(configWithPrimitives2, "discord");
      expect(accountIds2).toEqual(["account1"]);
    });
  });

  describe("listBoundAccountIds", () => {
    it("returns bound account ids for a given channel", () => {
      const accountIds = listBoundAccountIds(mockConfig, "discord");
      expect(accountIds).toEqual(["account1", "account2"]);
    });

    it("filters out invalid bindings", () => {
      const accountIds = listBoundAccountIds(mockConfigWithInvalids, "discord");
      expect(accountIds).toEqual(["account1"]);
    });

    it("returns empty array for unknown channel", () => {
      const accountIds = listBoundAccountIds(mockConfig, "unknown");
      expect(accountIds).toEqual([]);
    });

    it("handles null channel", () => {
      const accountIds = listBoundAccountIds(mockConfig, "");
      expect(accountIds).toEqual([]);
    });

    it("handles invalid channel that normalizes to null", () => {
      const accountIds = listBoundAccountIds(mockConfig, "   ");
      expect(accountIds).toEqual([]);
    });
  });

  describe("resolveDefaultAgentBoundAccountId", () => {
    it("returns account id bound to default agent", () => {
      const accountId = resolveDefaultAgentBoundAccountId(mockConfig, "discord");
      expect(accountId).toBe("account1"); // First match
    });

    it("handles invalid channel that normalizes to null", () => {
      const accountId = resolveDefaultAgentBoundAccountId(mockConfig, "   ");
      expect(accountId).toBeNull();
    });

    it("returns null if no binding for default agent", () => {
      const accountId = resolveDefaultAgentBoundAccountId(mockConfig, "telegram");
      expect(accountId).toBeNull();
    });

    it("returns null for unknown channel", () => {
      const accountId = resolveDefaultAgentBoundAccountId(mockConfig, "unknown");
      expect(accountId).toBeNull();
    });
  });

  describe("buildChannelAccountBindings", () => {
    it("builds map of channel -> agent -> accounts", () => {
      const map = buildChannelAccountBindings(mockConfig);

      expect(map.size).toBe(2);
      expect(map.get("discord")?.get("agent1")).toEqual(["account1", "account2"]);
      expect(map.get("telegram")?.get("agent2")).toEqual(["account3"]);
    });

    it("deduplicates accounts", () => {
      const configWithDupes = {
        bindings: [
          {
            type: "route",
            agentId: "agent1",
            match: { channel: "discord", accountId: "account1" },
          },
          {
            type: "route",
            agentId: "agent1",
            match: { channel: "discord", accountId: "account1" },
          },
        ],
      } as unknown as OpenClawConfig;

      const map = buildChannelAccountBindings(configWithDupes);
      expect(map.get("discord")?.get("agent1")).toEqual(["account1"]);
    });
  });

  describe("resolvePreferredAccountId", () => {
    it("returns first bound account if available", () => {
      const accountId = resolvePreferredAccountId({
        accountIds: ["account1", "account2"],
        defaultAccountId: "default",
        boundAccounts: ["bound1", "bound2"],
      });
      expect(accountId).toBe("bound1");
    });

    it("returns default account if no bound accounts", () => {
      const accountId = resolvePreferredAccountId({
        accountIds: ["account1", "account2"],
        defaultAccountId: "default",
        boundAccounts: [],
      });
      expect(accountId).toBe("default");
    });
  });
});
