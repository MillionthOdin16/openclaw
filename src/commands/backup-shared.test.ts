
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  encodeAbsolutePathForBackupArchive,
  buildBackupArchivePath,
  buildBackupArchiveRoot,
  buildBackupArchiveBasename,
  resolveBackupPlanFromDisk
} from "./backup-shared.js";
import path from "node:path";
import fs from "node:fs/promises";

vi.mock("node:fs/promises", () => ({
  default: {
    realpath: vi.fn(),
  }
}));

vi.mock("../config/config.js", () => ({
  readConfigFileSnapshot: vi.fn(),
  resolveConfigPath: vi.fn().mockReturnValue("/home/user/.openclaw/config.json"),
  resolveOAuthDir: vi.fn().mockReturnValue("/home/user/.openclaw/oauth"),
  resolveStateDir: vi.fn().mockReturnValue("/home/user/.openclaw"),
}));

vi.mock("../utils.js", () => ({
  pathExists: vi.fn(),
  shortenHomePath: vi.fn((p) => p.replace("/home/user", "~")),
}));

vi.mock("./cleanup-utils.js", () => ({
  buildCleanupPlan: vi.fn(),
  isPathWithin: vi.fn((child, parent) => {
    return child.startsWith(parent) && child.length > parent.length;
  }),
}));

describe("backup-shared", () => {
  describe("encodeAbsolutePathForBackupArchive", () => {
    it("encodes posix absolute paths", () => {
      expect(encodeAbsolutePathForBackupArchive("/home/user/.openclaw/config.json")).toBe("posix/home/user/.openclaw/config.json");
    });

    it("encodes windows absolute paths", () => {
      expect(encodeAbsolutePathForBackupArchive("C:/Users/user/.openclaw/config.json")).toBe("windows/C/Users/user/.openclaw/config.json");
      expect(encodeAbsolutePathForBackupArchive("d:\\Users\\user\\.openclaw\\config.json")).toBe("windows/D/Users/user/.openclaw/config.json");
    });

    it("encodes relative paths", () => {
      expect(encodeAbsolutePathForBackupArchive("some/relative/path")).toBe("relative/some/relative/path");
    });
  });

  describe("buildBackupArchivePath", () => {
    it("builds the correct archive path", () => {
      expect(buildBackupArchivePath("my-archive-root", "/home/user/.openclaw")).toBe("my-archive-root/payload/posix/home/user/.openclaw");
    });
  });

  describe("buildBackupArchiveRoot", () => {
    it("generates predictable roots based on timestamp", () => {
      const now = new Date("2024-03-10T12:00:00.000Z").getTime();
      const root = buildBackupArchiveRoot(now);
      expect(root).toContain("openclaw-backup");
    });
  });

  describe("buildBackupArchiveBasename", () => {
    it("appends .tar.gz to the root", () => {
      const now = new Date("2024-03-10T12:00:00.000Z").getTime();
      const basename = buildBackupArchiveBasename(now);
      expect(basename).toMatch(/\.tar\.gz$/);
      expect(basename).toContain("openclaw-backup");
    });
  });

  describe("resolveBackupPlanFromDisk", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    afterEach(() => {
      vi.resetModules();
    });

    it("handles onlyConfig when config is missing", async () => {
      const { resolveConfigPath, resolveOAuthDir, resolveStateDir } = await import("../config/config.js");
      const { pathExists } = await import("../utils.js");

      vi.mocked(resolveConfigPath).mockReturnValue("/home/user/.openclaw/config.json");
      vi.mocked(resolveStateDir).mockReturnValue("/home/user/.openclaw");
      vi.mocked(resolveOAuthDir).mockReturnValue("/home/user/.openclaw/oauth");

      vi.mocked(pathExists).mockResolvedValue(false);

      const plan = await resolveBackupPlanFromDisk({ onlyConfig: true });

      expect(plan.skipped).toHaveLength(1);
      expect(plan.skipped[0].reason).toBe("missing");
      expect(plan.included).toHaveLength(0);
    });

    it("handles onlyConfig when config exists", async () => {
      const { resolveConfigPath, resolveOAuthDir, resolveStateDir } = await import("../config/config.js");
      const { pathExists } = await import("../utils.js");

      vi.mocked(resolveConfigPath).mockReturnValue("/home/user/.openclaw/config.json");
      vi.mocked(resolveStateDir).mockReturnValue("/home/user/.openclaw");
      vi.mocked(resolveOAuthDir).mockReturnValue("/home/user/.openclaw/oauth");

      vi.mocked(pathExists).mockResolvedValue(true);
      vi.mocked(fs.realpath).mockResolvedValue("/home/user/.openclaw/config.json");

      const plan = await resolveBackupPlanFromDisk({ onlyConfig: true });

      expect(plan.skipped).toHaveLength(0);
      expect(plan.included).toHaveLength(1);
      expect(plan.included[0].kind).toBe("config");
    });

    it("handles full backup successfully", async () => {
      const { resolveConfigPath, resolveOAuthDir, resolveStateDir, readConfigFileSnapshot } = await import("../config/config.js");
      const { pathExists } = await import("../utils.js");
      const { buildCleanupPlan } = await import("./cleanup-utils.js");

      vi.mocked(resolveConfigPath).mockReturnValue("/home/user/.openclaw/config.json");
      vi.mocked(resolveStateDir).mockReturnValue("/home/user/.openclaw");
      vi.mocked(resolveOAuthDir).mockReturnValue("/home/user/.openclaw/oauth");

      vi.mocked(readConfigFileSnapshot).mockResolvedValue({
        exists: true,
        valid: true,
        path: "/home/user/.openclaw/config.json",
        config: {}
      } as any);

      vi.mocked(buildCleanupPlan).mockReturnValue({
        configInsideState: false,
        oauthInsideState: true, // will be covered by state
        workspaceDirs: ["/home/user/my-workspace"]
      } as any);

      vi.mocked(pathExists).mockImplementation(async (p) => {
        return p !== "/home/user/my-workspace"; // simulate workspace missing
      });

      vi.mocked(fs.realpath).mockImplementation(async (p) => p);

      const plan = await resolveBackupPlanFromDisk({ includeWorkspace: true });

            expect(plan.included).toHaveLength(1);
      expect(plan.included.map(i => i.kind)).toContain("state");

            expect(plan.skipped).toHaveLength(2);
      expect(plan.skipped.map(s => s.kind)).toContain("workspace");
      expect(plan.skipped.map(s => s.kind)).toContain("config");
    });

    it("handles overlapping canonical paths correctly", async () => {
      const { resolveConfigPath, resolveOAuthDir, resolveStateDir, readConfigFileSnapshot } = await import("../config/config.js");
      const { pathExists } = await import("../utils.js");
      const { buildCleanupPlan } = await import("./cleanup-utils.js");

      vi.mocked(resolveConfigPath).mockReturnValue("/home/user/.openclaw/config.json");
      vi.mocked(resolveStateDir).mockReturnValue("/home/user/.openclaw");
      vi.mocked(resolveOAuthDir).mockReturnValue("/home/user/.openclaw/oauth");

      vi.mocked(readConfigFileSnapshot).mockResolvedValue({
        exists: true,
        valid: true,
        path: "/home/user/.openclaw/config.json",
        config: {}
      } as any);

      vi.mocked(buildCleanupPlan).mockReturnValue({
        configInsideState: false,
        oauthInsideState: false,
        workspaceDirs: ["/home/user/.openclaw/workspace"] // Inside state
      } as any);

      vi.mocked(pathExists).mockResolvedValue(true);
      vi.mocked(fs.realpath).mockImplementation(async (p) => p);

      const plan = await resolveBackupPlanFromDisk({ includeWorkspace: true });

            expect(plan.included).toHaveLength(1);
      expect(plan.included.map(i => i.kind)).toContain("state");

            expect(plan.skipped).toHaveLength(3);
      expect(plan.skipped.map(s => s.kind)).toContain("workspace");
      expect(plan.skipped.map(s => s.kind)).toContain("credentials");
      expect(plan.skipped.map(s => s.kind)).toContain("config");
    });

    it("throws if config is invalid and includeWorkspace is true", async () => {
      const { readConfigFileSnapshot } = await import("../config/config.js");

      vi.mocked(readConfigFileSnapshot).mockResolvedValue({
        exists: true,
        valid: false,
        path: "/home/user/.openclaw/config.json",
        config: null
      } as any);

      await expect(resolveBackupPlanFromDisk({ includeWorkspace: true }))
        .rejects
        .toThrow(/Config invalid at/);
    });
  });
});
