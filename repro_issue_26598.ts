import { describe, it, expect, vi } from "vitest";
import { resolveSessionAuthProfileOverride } from "./src/agents/auth-profiles/session-override.js";
import { SessionEntry } from "./src/config/sessions.js";

describe("Bug #26598 Reproduction", () => {
  it("should not persist providerOverride when updating auth profile after compaction", async () => {
    const sessionKey = "agent:main:test";
    const storePath = "/tmp/sessions.json";

    // Initial session entry without providerOverride
    const sessionEntry: SessionEntry = {
      sessionId: "test-session",
      updatedAt: Date.now(),
      compactionCount: 5, // Compaction happened externally (e.g. via incrementRunCompactionCount)
      authProfileOverride: "google:default",
      authProfileOverrideSource: "auto",
      authProfileOverrideCompactionCount: 4, // Stale count
      // providerOverride is undefined
    };

    const sessionStore: Record<string, SessionEntry> = {
      [sessionKey]: sessionEntry
    };

    // Mock dependencies
    const cfg: any = {
      agents: {
        defaults: {
          model: {
            primary: "google/gemini-2.5-flash",
          }
        }
      }
    };

    // Mock ensureAuthProfileStore to return our profile
    vi.mock("./src/agents/auth-profiles.js", async (importOriginal) => {
      const actual = await importOriginal<any>();
      return {
        ...actual,
        ensureAuthProfileStore: () => ({
          profiles: {
            "google:default": { provider: "google" }
          }
        }),
        resolveAuthProfileOrder: () => ["google:default"],
        isProfileInCooldown: () => false,
      };
    });

    // Mock updateSessionStore to verify what gets written
    const updateSessionStoreMock = vi.fn();
    vi.mock("./src/config/sessions.js", async (importOriginal) => {
       const actual = await importOriginal<any>();
       return {
         ...actual,
         updateSessionStore: updateSessionStoreMock
       };
    });

    // We also need to mock import { updateSessionStore } from ... in the SUT
    // But since we are importing SUT, we need to mock it before import or use vi.mock properly.
    // However, since we are in the same file context as the test runner in this environment,
    // we rely on the mocking capabilities of vitest/jest.

    // Execute SUT
    await resolveSessionAuthProfileOverride({
      cfg,
      provider: "google",
      agentDir: "/tmp",
      sessionEntry,
      sessionStore,
      sessionKey,
      storePath,
      isNewSession: false
    });

    // Verify
    expect(updateSessionStoreMock).toHaveBeenCalled();
    const updateCallback = updateSessionStoreMock.mock.calls[0][1];
    const storeToUpdate: any = {};
    await updateCallback(storeToUpdate);

    const updatedEntry = storeToUpdate[sessionKey];
    expect(updatedEntry.authProfileOverrideCompactionCount).toBe(5);
    expect(updatedEntry.providerOverride).toBeUndefined(); // This is what we expect to fail if the bug is here
  });
});
