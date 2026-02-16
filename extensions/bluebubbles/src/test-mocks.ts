import { vi } from "vitest";

const accountsMockModule = vi.hoisted(() => ({
  resolveBlueBubblesAccount: vi.fn(
    (params: {
      cfg?: { channels?: { bluebubbles?: Record<string, unknown> } };
      accountId?: string;
    }) => {
      const config = params.cfg?.channels?.bluebubbles ?? {};
      return {
        accountId: params.accountId ?? "default",
        enabled: config.enabled !== false,
        configured: Boolean(config.serverUrl && config.password),
        config,
      };
    },
  ),
}));

const probeMockModule = vi.hoisted(() => ({
  getCachedBlueBubblesPrivateApiStatus: vi.fn().mockReturnValue(null),
}));

vi.mock("./accounts.js", () => accountsMockModule);
vi.mock("./probe.js", () => probeMockModule);
