import { describe, expect, it, vi } from "vitest";
import { encodeAbsolutePathForBackupArchive, buildBackupArchivePath, buildBackupArchiveRoot, buildBackupArchiveBasename, resolveBackupPlanFromDisk } from "./backup-shared.js";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

describe("encodeAbsolutePathForBackupArchive", () => {
  it("encodes windows absolute paths", () => {
    expect(encodeAbsolutePathForBackupArchive("C:\\Users\\User\\config")).toBe("windows/C/Users/User/config");
    expect(encodeAbsolutePathForBackupArchive("d:/data/backup")).toBe("windows/D/data/backup");
  });

  it("encodes posix absolute paths", () => {
    expect(encodeAbsolutePathForBackupArchive("/home/user/.config")).toBe("posix/home/user/.config");
    expect(encodeAbsolutePathForBackupArchive("/var/lib/data/")).toBe("posix/var/lib/data/");
  });

  it("encodes relative paths", () => {
    expect(encodeAbsolutePathForBackupArchive("relative/path/to/file")).toBe("relative/relative/path/to/file");
  });
});

describe("buildBackupArchivePath", () => {
  it("combines archive root and encoded source path", () => {
    expect(buildBackupArchivePath("my-archive-root", "/home/user/.config")).toBe("my-archive-root/payload/posix/home/user/.config");
  });
});

describe("buildBackupArchiveRoot", () => {
  it("generates root with default current time", () => {
    const root = buildBackupArchiveRoot();
    expect(root).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z-openclaw-backup$/);
  });
  it("generates root with specified time", () => {
    const root = buildBackupArchiveRoot(Date.UTC(2026, 2, 9, 2, 0, 0));
    expect(root).toBe("2026-03-09T02-00-00.000Z-openclaw-backup");
  });
});

describe("buildBackupArchiveBasename", () => {
  it("generates basename with specified time", () => {
    const root = buildBackupArchiveBasename(Date.UTC(2026, 2, 9, 2, 0, 0));
    expect(root).toBe("2026-03-09T02-00-00.000Z-openclaw-backup.tar.gz");
  });
});

describe("resolveBackupPlanFromDisk covering duplicate paths properly", () => {
  it("filters duplicates", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "backup-shared-dup-oauth-"));
    const stateDir = path.join(tempDir, "state");
    const oauthDir = path.join(tempDir, "state"); // duplicate!

    await fs.mkdir(stateDir);
    // valid config to avoid error
    const configPath = path.join(tempDir, "config.json");
    await fs.writeFile(configPath, JSON.stringify({}));

    vi.stubEnv("OPENCLAW_STATE_DIR", stateDir);
    vi.stubEnv("OPENCLAW_CONFIG_PATH", configPath);
    vi.stubEnv("OPENCLAW_OAUTH_DIR", oauthDir);

    try {
      const plan = await resolveBackupPlanFromDisk({ includeWorkspace: false });
      expect(plan.included.find(a => a.kind === "credentials")).toBeUndefined();
    } finally {
      vi.unstubAllEnvs();
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("resolveBackupPlanFromDisk covering duplicate paths properly via symlink", () => {
  it("filters duplicates", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "backup-shared-dup-oauth-2-"));
    const stateDir = path.join(tempDir, "state");
    const symlinkDir = path.join(tempDir, "symlink");

    await fs.mkdir(stateDir);
    await fs.symlink(stateDir, symlinkDir, "dir"); // symlinkDir points to stateDir

    const configPath = path.join(tempDir, "config.json");
    await fs.writeFile(configPath, JSON.stringify({}));

    vi.stubEnv("OPENCLAW_STATE_DIR", stateDir);
    vi.stubEnv("OPENCLAW_CONFIG_PATH", configPath);
    vi.stubEnv("OPENCLAW_OAUTH_DIR", symlinkDir);

    try {
      const plan = await resolveBackupPlanFromDisk({ includeWorkspace: false });
      expect(plan.included.find(a => a.kind === "credentials")).toBeUndefined();
    } finally {
      vi.unstubAllEnvs();
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
