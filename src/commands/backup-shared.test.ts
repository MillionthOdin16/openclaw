import { describe, expect, it, vi, beforeEach } from "vitest";
import * as configMod from "../config/config.js";
import * as utilsMod from "../utils.js";
import {
  encodeAbsolutePathForBackupArchive,
  buildBackupArchiveRoot,
  buildBackupArchiveBasename,
  buildBackupArchivePath,
  resolveBackupPlanFromDisk,
} from "./backup-shared.js";
import * as cleanupUtilsMod from "./cleanup-utils.js";

describe("encodeAbsolutePathForBackupArchive", () => {
  it("encodes posix paths correctly", () => {
    expect(encodeAbsolutePathForBackupArchive("/home/user/.openclaw")).toBe(
      "posix/home/user/.openclaw",
    );
  });

  it("encodes windows paths correctly", () => {
    expect(encodeAbsolutePathForBackupArchive("C:/Users/User/.openclaw")).toBe(
      "windows/C/Users/User/.openclaw",
    );
  });

  it("encodes windows backslash paths correctly", () => {
    expect(encodeAbsolutePathForBackupArchive("C:\\Users\\User\\.openclaw")).toBe(
      "windows/C/Users/User/.openclaw",
    );
  });

  it("encodes relative paths correctly", () => {
    expect(encodeAbsolutePathForBackupArchive("home/user/.openclaw")).toBe(
      "relative/home/user/.openclaw",
    );
  });
});

describe("encodeAbsolutePathForBackupArchive edge cases", () => {
  it("handles empty windows match groups", () => {
    expect(encodeAbsolutePathForBackupArchive("C:/")).toBe("windows/C");
  });
});

describe("buildBackupArchiveRoot", () => {
  it("formats the root directory based on the timestamp using formatSessionArchiveTimestamp", () => {
    const timestamp = 1735732800000;
    expect(buildBackupArchiveRoot(timestamp)).toBe("2025-01-01T12-00-00.000Z-openclaw-backup");
  });
});

describe("buildBackupArchiveBasename", () => {
  it("formats the tarball name based on the timestamp", () => {
    const timestamp = 1735732800000;
    expect(buildBackupArchiveBasename(timestamp)).toBe(
      "2025-01-01T12-00-00.000Z-openclaw-backup.tar.gz",
    );
  });
});

describe("buildBackupArchivePath", () => {
  it("combines archive root and encoded path", () => {
    const archiveRoot = "my-backup-root";
    const sourcePath = "/home/user/.openclaw/config.json";
    expect(buildBackupArchivePath(archiveRoot, sourcePath)).toBe(
      "my-backup-root/payload/posix/home/user/.openclaw/config.json",
    );
  });
});

describe("resolveBackupPlanFromDisk", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("handles onlyConfig=true and missing config", async () => {
    vi.spyOn(configMod, "resolveStateDir").mockReturnValue("/mock/state");
    vi.spyOn(configMod, "resolveConfigPath").mockReturnValue("/mock/config.json");
    vi.spyOn(configMod, "resolveOAuthDir").mockReturnValue("/mock/oauth");
    vi.spyOn(utilsMod, "pathExists").mockResolvedValue(false);
    vi.spyOn(utilsMod, "shortenHomePath").mockImplementation(
      (p) => `~${p.substring(p.lastIndexOf("/"))}`,
    );

    const plan = await resolveBackupPlanFromDisk({ onlyConfig: true });

    expect(plan.skipped).toHaveLength(1);
    expect(plan.skipped[0].kind).toBe("config");
    expect(plan.skipped[0].reason).toBe("missing");
    expect(plan.included).toHaveLength(0);
  });

  it("throws if config invalid when includeWorkspace is true", async () => {
    vi.spyOn(configMod, "resolveStateDir").mockReturnValue("/mock/state");
    vi.spyOn(configMod, "resolveConfigPath").mockReturnValue("/mock/config.json");
    vi.spyOn(configMod, "resolveOAuthDir").mockReturnValue("/mock/oauth");

    vi.spyOn(configMod, "readConfigFileSnapshot").mockResolvedValue({
      exists: true,
      valid: false,
      path: "/mock/config.json",
      raw: "invalid json",
      config: null as unknown as Record<string, unknown>,
    });

    await expect(resolveBackupPlanFromDisk({ includeWorkspace: true })).rejects.toThrow(
      "Config invalid at",
    );
  });

  it("gathers full backup plan correctly", async () => {
    vi.spyOn(configMod, "resolveStateDir").mockReturnValue("/mock/state");
    vi.spyOn(configMod, "resolveConfigPath").mockReturnValue("/mock/config.json");
    vi.spyOn(configMod, "resolveOAuthDir").mockReturnValue("/mock/oauth");
    vi.spyOn(utilsMod, "shortenHomePath").mockImplementation(
      (p) => `~${p.substring(p.lastIndexOf("/"))}`,
    );

    vi.spyOn(configMod, "readConfigFileSnapshot").mockResolvedValue({
      exists: true,
      valid: true,
      path: "/mock/config.json",
      raw: "{}",
      config: {} as unknown as Record<string, unknown>,
    });

    vi.spyOn(cleanupUtilsMod, "buildCleanupPlan").mockReturnValue({
      workspaceDirs: ["/mock/workspace"],
      configInsideState: false,
      oauthInsideState: false,
      logArchiveDir: "/mock/state/logs",
    } as unknown as Record<string, unknown>);

    vi.spyOn(utilsMod, "pathExists").mockImplementation(async (p) => {
      if (p === "/mock/state" || p === "/mock/config.json" || p === "/mock/workspace") {
        return true;
      }
      return false;
    });

    const plan = await resolveBackupPlanFromDisk({ includeWorkspace: true });

    expect(plan.stateDir).toBe("/mock/state");
    expect(plan.configPath).toBe("/mock/config.json");
    expect(plan.oauthDir).toBe("/mock/oauth");
    expect(plan.workspaceDirs).toEqual(["/mock/workspace"]);

    const includedKinds = plan.included.map((a) => a.kind);
    expect(includedKinds).toContain("state");
    expect(includedKinds).toContain("config");
    expect(includedKinds).toContain("workspace");

    expect(plan.skipped).toHaveLength(1);
    expect(plan.skipped[0].kind).toBe("credentials");
    expect(plan.skipped[0].reason).toBe("missing");
  });

  it("handles when config and oauth are inside state", async () => {
    vi.spyOn(configMod, "resolveStateDir").mockReturnValue("/mock/state");
    vi.spyOn(configMod, "resolveConfigPath").mockReturnValue("/mock/state/config.json");
    vi.spyOn(configMod, "resolveOAuthDir").mockReturnValue("/mock/state/oauth");
    vi.spyOn(utilsMod, "shortenHomePath").mockImplementation((p) => p);

    vi.spyOn(configMod, "readConfigFileSnapshot").mockResolvedValue({
      exists: true,
      valid: true,
      path: "/mock/state/config.json",
      raw: "{}",
      config: {} as unknown as Record<string, unknown>,
    });

    vi.spyOn(cleanupUtilsMod, "buildCleanupPlan").mockReturnValue({
      workspaceDirs: [],
      configInsideState: true,
      oauthInsideState: true,
      logArchiveDir: "/mock/state/logs",
    } as unknown as Record<string, unknown>);

    vi.spyOn(utilsMod, "pathExists").mockResolvedValue(true);

    const plan = await resolveBackupPlanFromDisk({ includeWorkspace: false });

    const includedKinds = plan.included.map((a) => a.kind);
    expect(includedKinds).toEqual(["state"]);
    expect(plan.skipped).toHaveLength(0);
  });

  it("handles missing config in onlyConfig mode", async () => {
    vi.spyOn(configMod, "resolveStateDir").mockReturnValue("/mock/state");
    vi.spyOn(configMod, "resolveConfigPath").mockReturnValue("/mock/config.json");
    vi.spyOn(configMod, "resolveOAuthDir").mockReturnValue("/mock/oauth");
    vi.spyOn(utilsMod, "shortenHomePath").mockImplementation((p) => p);
    vi.spyOn(utilsMod, "pathExists").mockResolvedValue(false);

    const plan = await resolveBackupPlanFromDisk({ onlyConfig: true });

    expect(plan.included).toHaveLength(0);
    expect(plan.skipped).toHaveLength(1);
    expect(plan.skipped[0].kind).toBe("config");
    expect(plan.skipped[0].reason).toBe("missing");
  });

  it("handles present config in onlyConfig mode", async () => {
    vi.spyOn(configMod, "resolveStateDir").mockReturnValue("/mock/state");
    vi.spyOn(configMod, "resolveConfigPath").mockReturnValue("/mock/config.json");
    vi.spyOn(configMod, "resolveOAuthDir").mockReturnValue("/mock/oauth");
    vi.spyOn(utilsMod, "shortenHomePath").mockImplementation((p) => p);
    vi.spyOn(utilsMod, "pathExists").mockResolvedValue(true);

    const plan = await resolveBackupPlanFromDisk({ onlyConfig: true });

    expect(plan.included).toHaveLength(1);
    expect(plan.included[0].kind).toBe("config");
    expect(plan.skipped).toHaveLength(0);
  });

  it("handles covered paths", async () => {
    vi.spyOn(configMod, "resolveStateDir").mockReturnValue("/mock/state");
    vi.spyOn(configMod, "resolveConfigPath").mockReturnValue("/mock/state/config.json");
    vi.spyOn(configMod, "resolveOAuthDir").mockReturnValue("/mock/state/oauth");
    vi.spyOn(utilsMod, "shortenHomePath").mockImplementation((p) => p);

    vi.spyOn(configMod, "readConfigFileSnapshot").mockResolvedValue({
      exists: true,
      valid: true,
      path: "/mock/state/config.json",
      raw: "{}",
      config: {} as unknown as Record<string, unknown>,
    });

    vi.spyOn(cleanupUtilsMod, "buildCleanupPlan").mockReturnValue({
      workspaceDirs: ["/mock/state/workspace"],
      configInsideState: false, // Intentionally tricking it to produce duplicate entries
      oauthInsideState: false, // Intentionally tricking it to produce duplicate entries
      logArchiveDir: "/mock/state/logs",
    } as unknown as Record<string, unknown>);

    vi.spyOn(utilsMod, "pathExists").mockResolvedValue(true);

    const plan = await resolveBackupPlanFromDisk({ includeWorkspace: true });

    // Since config and oauth are inside state, they should be marked as covered
    const includedKinds = plan.included.map((a) => a.kind);
    expect(includedKinds).toEqual(["state"]);

    expect(plan.skipped).toHaveLength(3);
    const skippedKinds = plan.skipped.map((a) => a.kind);
    expect(skippedKinds).toContain("config");
    expect(skippedKinds).toContain("credentials");
    expect(skippedKinds).toContain("workspace");

    plan.skipped.forEach((s) => {
      expect(s.reason).toBe("covered");
      expect(s.coveredBy).toBe("/mock/state");
    });
  });

  it("prioritizes state first", async () => {
    vi.spyOn(configMod, "resolveStateDir").mockReturnValue("/mock/aa-st");
    vi.spyOn(configMod, "resolveConfigPath").mockReturnValue("/mock/bb-cf");
    vi.spyOn(configMod, "resolveOAuthDir").mockReturnValue("/mock/cc-oa");
    vi.spyOn(utilsMod, "shortenHomePath").mockImplementation((p) => p);
    vi.spyOn(configMod, "readConfigFileSnapshot").mockResolvedValue({
      exists: true,
      valid: true,
      path: "/mock/bb-cf",
      raw: "{}",
      config: {} as unknown as Record<string, unknown>,
    });

    vi.spyOn(cleanupUtilsMod, "buildCleanupPlan").mockReturnValue({
      workspaceDirs: ["/mock/dd-ws"],
      configInsideState: false,
      oauthInsideState: false,
      logArchiveDir: "/mock/logs",
    } as unknown as Record<string, unknown>);

    vi.spyOn(utilsMod, "pathExists").mockResolvedValue(true);

    const plan = await resolveBackupPlanFromDisk({ includeWorkspace: true });

    const includedKinds = plan.included.map((a) => a.kind);
    expect(includedKinds).toEqual(["state", "config", "credentials", "workspace"]);
  });

  it("falls back to resolve if realpath fails", async () => {
    vi.spyOn(configMod, "resolveStateDir").mockReturnValue("/mock/state");
    vi.spyOn(configMod, "resolveConfigPath").mockReturnValue("/mock/config.json");
    vi.spyOn(configMod, "resolveOAuthDir").mockReturnValue("/mock/oauth");
    vi.spyOn(utilsMod, "shortenHomePath").mockImplementation((p) => p);
    vi.spyOn(utilsMod, "pathExists").mockResolvedValue(true);

    vi.spyOn(configMod, "readConfigFileSnapshot").mockResolvedValue({
      exists: true,
      valid: true,
      path: "/mock/config.json",
      raw: "{}",
      config: {} as unknown as Record<string, unknown>,
    });

    vi.spyOn(cleanupUtilsMod, "buildCleanupPlan").mockReturnValue({
      workspaceDirs: [],
      configInsideState: false,
      oauthInsideState: false,
      logArchiveDir: "/mock/state/logs",
    } as unknown as Record<string, unknown>);

    // To hit the catch block in canonicalizeExistingPath, we need fs.realpath to throw
    const fs = await import("node:fs/promises");
    vi.spyOn(fs.default, "realpath").mockRejectedValue(new Error("EACCES"));

    const plan = await resolveBackupPlanFromDisk({ includeWorkspace: true });

    // It should have caught the error and used path.resolve instead
    expect(plan.included).toHaveLength(3);
    const includedKinds = plan.included.map((a) => a.kind);
    expect(includedKinds).toContain("state");
    expect(includedKinds).toContain("config");
    expect(includedKinds).toContain("credentials");
  });

  it("sorts by localeCompare if depths and priorities are identical", async () => {
    vi.spyOn(configMod, "resolveStateDir").mockReturnValue("/mock/z-state");
    vi.spyOn(configMod, "resolveConfigPath").mockReturnValue("/mock/a-state");
    vi.spyOn(configMod, "resolveOAuthDir").mockReturnValue("/mock/oauth");
    vi.spyOn(utilsMod, "shortenHomePath").mockImplementation((p) => p);
    vi.spyOn(utilsMod, "pathExists").mockResolvedValue(true);

    vi.spyOn(configMod, "readConfigFileSnapshot").mockResolvedValue({
      exists: true,
      valid: true,
      path: "/mock/a-state",
      raw: "{}",
      config: {} as unknown as Record<string, unknown>,
    });

    vi.spyOn(cleanupUtilsMod, "buildCleanupPlan").mockReturnValue({
      workspaceDirs: ["/mock/workZ", "/mock/workA"],
      configInsideState: true,
      oauthInsideState: true,
      logArchiveDir: "/mock/z-state/logs",
    } as unknown as Record<string, unknown>);

    vi.spyOn(configMod, "resolveStateDir").mockReturnValue("/mock/state");

    const plan = await resolveBackupPlanFromDisk({ includeWorkspace: true });

    expect(plan.included.map((a) => a.sourcePath)).toEqual([
      expect.stringContaining("state"),
      expect.stringContaining("workA"),
      expect.stringContaining("workZ"),
    ]);
  });

  it("skips duplicate canonical paths", async () => {
    vi.spyOn(configMod, "resolveStateDir").mockReturnValue("/mock/state");
    vi.spyOn(configMod, "resolveConfigPath").mockReturnValue("/mock/state");
    vi.spyOn(configMod, "resolveOAuthDir").mockReturnValue("/mock/state");
    vi.spyOn(utilsMod, "shortenHomePath").mockImplementation((p) => p);
    vi.spyOn(utilsMod, "pathExists").mockResolvedValue(true);

    vi.spyOn(configMod, "readConfigFileSnapshot").mockResolvedValue({
      exists: true,
      valid: true,
      path: "/mock/state",
      raw: "{}",
      config: {} as unknown as Record<string, unknown>,
    });

    vi.spyOn(cleanupUtilsMod, "buildCleanupPlan").mockReturnValue({
      workspaceDirs: ["/mock/state"],
      configInsideState: false,
      oauthInsideState: false,
      logArchiveDir: "/mock/state/logs",
    } as unknown as Record<string, unknown>);

    const plan = await resolveBackupPlanFromDisk({ includeWorkspace: true });

    expect(plan.included).toHaveLength(1);
    expect(plan.included[0].kind).toBe("state");
  });
});
