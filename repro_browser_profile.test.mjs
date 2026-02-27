// Reproduction script for Browser Profile Bug using Node's test runner
import assert from "node:assert";
import { describe, it } from "node:test";

// Mock the problematic logic from src/browser/config.ts directly
// since we can't easily import the internal TS file without compilation.

const DEFAULT_BROWSER_DEFAULT_PROFILE_NAME = "chrome";
const DEFAULT_OPENCLAW_BROWSER_PROFILE_NAME = "openclaw";

// The logic from `ensureDefaultChromeExtensionProfile`
function ensureDefaultChromeExtensionProfile(profiles, controlPort) {
  const result = { ...profiles };
  if (result.chrome) {
    return result;
  }
  const relayPort = controlPort + 1;
  result.chrome = {
    driver: "extension",
    cdpUrl: `http://127.0.0.1:${relayPort}`,
    color: "#00AA00",
  };
  return result;
}

// The logic from `resolveBrowserConfig` for picking the default profile
function resolveDefaultProfile(defaultProfileFromConfig, profiles) {
  return (
    defaultProfileFromConfig ??
    (profiles[DEFAULT_BROWSER_DEFAULT_PROFILE_NAME]
      ? DEFAULT_BROWSER_DEFAULT_PROFILE_NAME
      : DEFAULT_OPENCLAW_BROWSER_PROFILE_NAME)
  );
}

describe("Browser Profile Bug Reproduction", () => {
  it("should confirm that 'chrome' (extension driver) becomes default implicitly", () => {
    // Scenario: User has 'openclaw' profile configured implicitly or explicitly,
    // but no defaultProfile set in config.
    const userProfiles = {
      openclaw: { cdpPort: 9222, color: "blue" },
    };
    const controlPort = 10000;

    // 1. `ensureDefaultChromeExtensionProfile` runs
    // It ALWAYS adds a 'chrome' profile if missing.
    const resolvedProfiles = ensureDefaultChromeExtensionProfile(
      userProfiles,
      controlPort,
    );

    // Verify 'chrome' profile was added
    assert.ok(resolvedProfiles.chrome, "'chrome' profile should be auto-created");
    assert.strictEqual(
      resolvedProfiles.chrome.driver,
      "extension",
      "Driver should be 'extension'",
    );

    // 2. `resolveDefaultProfile` runs
    // The user did not specify a default profile (`undefined`).
    const defaultProfile = resolveDefaultProfile(undefined, resolvedProfiles);

    // BUG: The logic prefers 'chrome' if it exists. Since step 1 created it,
    // the default becomes 'chrome' (extension driver), overriding 'openclaw'.
    assert.strictEqual(
      defaultProfile,
      "chrome",
      "Default profile should become 'chrome' (The BUG)",
    );

    console.log(
      "Bug Confirmed: 'chrome' profile (extension driver) was force-selected as default.",
    );
  });
});
