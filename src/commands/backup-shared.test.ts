
import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { resolveBackupPlanFromDisk, encodeAbsolutePathForBackupArchive } from "./backup-shared.js";
import * as config from "../config/config.js";
import * as utils from "../utils.js";
import * as cleanupUtils from "./cleanup-utils.js";

vi.mock("../config/config.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../config/config.js")>();
  return {
    ...actual,
    resolveStateDir: vi.fn(),
    resolveConfigPath: vi.fn(),
    resolveOAuthDir: vi.fn(),
    readConfigFileSnapshot: vi.fn(),
  };
});

vi.mock("../utils.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils.js")>();
  return {
    ...actual,
    pathExists: vi.fn(),
  };
});

vi.mock("./cleanup-utils.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./cleanup-utils.js")>();
  return {
    ...actual,
    buildCleanupPlan: vi.fn(),
  };
});

describe("backup-shared", () => {
  describe("encodeAbsolutePathForBackupArchive", () => {
    it("handles windows paths with backslashes", () => {
      expect(encodeAbsolutePathForBackupArchive("C:\\Windows\\System32")).toBe("windows/C/Windows/System32");
    });

    it("handles windows paths with forward slashes", () => {
      expect(encodeAbsolutePathForBackupArchive("D:/data/files")).toBe("windows/D/data/files");
    });

    it("handles relative paths", () => {
      expect(encodeAbsolutePathForBackupArchive("relative/path/here")).toBe("relative/relative/path/here");
    });



    it("handles windows paths missing optional parts", () => {
      // The match group is (.*), so an empty rest is possible (e.g. C:/)
      expect(encodeAbsolutePathForBackupArchive("C:/")).toBe("windows/C");
    });

    it("handles unix absolute paths", () => {
      expect(encodeAbsolutePathForBackupArchive("/unix/absolute/path")).toBe("posix/unix/absolute/path");
    });


  });

  describe("resolveBackupPlanFromDisk", () => {
    beforeEach(() => {
      vi.mocked(config.resolveStateDir).mockReturnValue("/mock/state");
      vi.mocked(config.resolveConfigPath).mockReturnValue("/mock/config.json");
      vi.mocked(config.resolveOAuthDir).mockReturnValue("/mock/oauth");

      // Override fs.realpath to just return the path to avoid real filesystem access in some tests
      vi.spyOn(fs, "realpath").mockImplementation((p) => Promise.resolve(p as string));
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("handles missing config when onlyConfig is true", async () => {
      vi.mocked(utils.pathExists).mockResolvedValue(false);

      const plan = await resolveBackupPlanFromDisk({ onlyConfig: true });

      expect(plan.included).toHaveLength(0);
      expect(plan.skipped).toHaveLength(1);
      expect(plan.skipped[0].kind).toBe("config");
      expect(plan.skipped[0].reason).toBe("missing");
    });

    it("handles duplicate candidates in compareCandidates", async () => {
        vi.mocked(config.readConfigFileSnapshot).mockResolvedValue({
            exists: true,
            valid: true,
            config: {} as any,
            path: "/mock/config.json",
        });

        vi.mocked(cleanupUtils.buildCleanupPlan).mockReturnValue({
            stateDir: "/mock/state",
            configPath: "/mock/config.json",
            oauthDir: "/mock/oauth",
            workspaceDirs: ["/mock/workspace1", "/mock/workspace2"],
            configInsideState: false,
            oauthInsideState: false,
            workspacesInsideState: false,
        });

        vi.mocked(utils.pathExists).mockResolvedValue(true);

        // This will create a duplicate canonical path scenario
        vi.spyOn(fs, "realpath").mockResolvedValue("/mock/duplicate_path");

        const plan = await resolveBackupPlanFromDisk({ includeWorkspace: true });

        // Assert that the duplicate path was handled
        expect(plan.included).toHaveLength(1);
    });

    it("falls back to path.resolve when fs.realpath fails", async () => {
        vi.mocked(utils.pathExists).mockResolvedValue(true);
        const resolvedPath = path.resolve("/mock/config.json");

        vi.spyOn(fs, "realpath").mockRejectedValue(new Error("enoent"));

        const plan = await resolveBackupPlanFromDisk({ onlyConfig: true });

        expect(plan.included).toHaveLength(1);
        expect(plan.included[0].sourcePath).toBe(resolvedPath);
    });
  });
});
