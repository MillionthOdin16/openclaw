import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  rotateConfigBackups,
  hardenBackupPermissions,
  cleanOrphanBackups,
  maintainConfigBackups,
  BackupMaintenanceFs,
  BackupRotationFs,
  CONFIG_BACKUP_COUNT,
} from "./backup-rotation";

describe("backup-rotation", () => {
  const configPath = "/path/to/openclaw.json";

  let ioFs: BackupMaintenanceFs;

  beforeEach(() => {
    ioFs = {
      unlink: vi.fn().mockResolvedValue(undefined),
      rename: vi.fn().mockResolvedValue(undefined),
      chmod: vi.fn().mockResolvedValue(undefined),
      readdir: vi.fn().mockResolvedValue([]),
      copyFile: vi.fn().mockResolvedValue(undefined),
    };
  });

  describe("rotateConfigBackups", () => {
    it("should correctly rotate backups", async () => {
      await rotateConfigBackups(configPath, ioFs);

      const backupBase = `${configPath}.bak`;
      const maxIndex = CONFIG_BACKUP_COUNT - 1;

      expect(ioFs.unlink).toHaveBeenCalledWith(`${backupBase}.${maxIndex}`);
      for (let index = maxIndex - 1; index >= 1; index -= 1) {
        expect(ioFs.rename).toHaveBeenCalledWith(
          `${backupBase}.${index}`,
          `${backupBase}.${index + 1}`
        );
      }
      expect(ioFs.rename).toHaveBeenCalledWith(backupBase, `${backupBase}.1`);
    });

    it("should handle errors silently (best-effort)", async () => {
      ioFs.unlink = vi.fn().mockRejectedValue(new Error("unlink error"));
      ioFs.rename = vi.fn().mockRejectedValue(new Error("rename error"));

      await expect(rotateConfigBackups(configPath, ioFs)).resolves.toBeUndefined();

      const backupBase = `${configPath}.bak`;
      const maxIndex = CONFIG_BACKUP_COUNT - 1;
      expect(ioFs.unlink).toHaveBeenCalledWith(`${backupBase}.${maxIndex}`);
      expect(ioFs.rename).toHaveBeenCalledWith(backupBase, `${backupBase}.1`);
    });
  });

  describe("hardenBackupPermissions", () => {
    it("should explicitly chmod the primary .bak and all numbered backups", async () => {
      await hardenBackupPermissions(configPath, ioFs);

      const backupBase = `${configPath}.bak`;
      expect(ioFs.chmod).toHaveBeenCalledWith(backupBase, 0o600);
      for (let i = 1; i < CONFIG_BACKUP_COUNT; i++) {
        expect(ioFs.chmod).toHaveBeenCalledWith(`${backupBase}.${i}`, 0o600);
      }
    });

    it("should handle errors silently (best-effort)", async () => {
      ioFs.chmod = vi.fn().mockRejectedValue(new Error("chmod error"));

      await expect(hardenBackupPermissions(configPath, ioFs)).resolves.toBeUndefined();

      const backupBase = `${configPath}.bak`;
      expect(ioFs.chmod).toHaveBeenCalledWith(backupBase, 0o600);
    });

    it("should return early if ioFs.chmod is not provided", async () => {
      const ioFsWithoutChmod: BackupRotationFs = {
        unlink: vi.fn().mockResolvedValue(undefined),
        rename: vi.fn().mockResolvedValue(undefined),
      };

      await expect(hardenBackupPermissions(configPath, ioFsWithoutChmod)).resolves.toBeUndefined();
    });
  });

  describe("cleanOrphanBackups", () => {
    it("should remove orphan files and preserve valid numbered backups", async () => {
      ioFs.readdir = vi.fn().mockResolvedValue([
        "openclaw.json",
        "openclaw.json.bak",
        "openclaw.json.bak.1",
        "openclaw.json.bak.2",
        "openclaw.json.bak.3",
        "openclaw.json.bak.4",
        "openclaw.json.bak.12345",
        "openclaw.json.bak.tmp",
        "other-file.txt",
      ]);

      await cleanOrphanBackups(configPath, ioFs);

      expect(ioFs.unlink).toHaveBeenCalledWith("/path/to/openclaw.json.bak.12345");
      expect(ioFs.unlink).toHaveBeenCalledWith("/path/to/openclaw.json.bak.tmp");
      expect(ioFs.unlink).not.toHaveBeenCalledWith("/path/to/openclaw.json.bak.1");
      expect(ioFs.unlink).not.toHaveBeenCalledWith("/path/to/openclaw.json.bak.2");
      expect(ioFs.unlink).not.toHaveBeenCalledWith("/path/to/openclaw.json.bak.3");
      expect(ioFs.unlink).not.toHaveBeenCalledWith("/path/to/openclaw.json.bak.4");
      expect(ioFs.unlink).not.toHaveBeenCalledWith("/path/to/openclaw.json");
      expect(ioFs.unlink).not.toHaveBeenCalledWith("/path/to/openclaw.json.bak");
    });

    it("should handle errors silently (best-effort) for readdir", async () => {
      ioFs.readdir = vi.fn().mockRejectedValue(new Error("readdir error"));

      await expect(cleanOrphanBackups(configPath, ioFs)).resolves.toBeUndefined();
      expect(ioFs.unlink).not.toHaveBeenCalled();
    });

    it("should handle errors silently (best-effort) for unlink", async () => {
      ioFs.readdir = vi.fn().mockResolvedValue(["openclaw.json.bak.tmp"]);
      ioFs.unlink = vi.fn().mockRejectedValue(new Error("unlink error"));

      await expect(cleanOrphanBackups(configPath, ioFs)).resolves.toBeUndefined();
      expect(ioFs.unlink).toHaveBeenCalledWith("/path/to/openclaw.json.bak.tmp");
    });

    it("should return early if ioFs.readdir is not provided", async () => {
      const ioFsWithoutReaddir: BackupRotationFs = {
        unlink: vi.fn().mockResolvedValue(undefined),
        rename: vi.fn().mockResolvedValue(undefined),
      };

      await expect(cleanOrphanBackups(configPath, ioFsWithoutReaddir)).resolves.toBeUndefined();
    });
  });

  describe("maintainConfigBackups", () => {
    it("should execute the full backup maintenance cycle in correct order", async () => {
      ioFs.readdir = vi.fn().mockResolvedValue(["openclaw.json.bak.tmp"]);
      await maintainConfigBackups(configPath, ioFs);

      // rotateConfigBackups
      const backupBase = `${configPath}.bak`;
      const maxIndex = CONFIG_BACKUP_COUNT - 1;
      expect(ioFs.unlink).toHaveBeenCalledWith(`${backupBase}.${maxIndex}`);
      expect(ioFs.rename).toHaveBeenCalledWith(backupBase, `${backupBase}.1`);

      // copyFile
      expect(ioFs.copyFile).toHaveBeenCalledWith(configPath, `${configPath}.bak`);

      // hardenBackupPermissions
      expect(ioFs.chmod).toHaveBeenCalledWith(backupBase, 0o600);

      // cleanOrphanBackups
      expect(ioFs.unlink).toHaveBeenCalledWith("/path/to/openclaw.json.bak.tmp");
    });

    it("should handle copyFile errors silently", async () => {
      ioFs.copyFile = vi.fn().mockRejectedValue(new Error("copyFile error"));

      await expect(maintainConfigBackups(configPath, ioFs)).resolves.toBeUndefined();
      expect(ioFs.copyFile).toHaveBeenCalledWith(configPath, `${configPath}.bak`);
    });
  });
});
