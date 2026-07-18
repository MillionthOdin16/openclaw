import { describe, it, expect } from "vitest";
import {
  buildBackupArchiveRoot,
  buildBackupArchiveBasename,
  encodeAbsolutePathForBackupArchive,
  buildBackupArchivePath,
} from "./backup-shared.js";

describe("backup-shared", () => {
  describe("buildBackupArchiveRoot", () => {
    it("builds archive root with provided timestamp", () => {
      const root = buildBackupArchiveRoot(1704067200000);
      expect(root).toBe("2024-01-01T00-00-00.000Z-openclaw-backup");
    });
  });

  describe("buildBackupArchiveBasename", () => {
    it("builds archive basename with provided timestamp", () => {
      const basename = buildBackupArchiveBasename(1704067200000);
      expect(basename).toBe("2024-01-01T00-00-00.000Z-openclaw-backup.tar.gz");
    });
  });

  describe("encodeAbsolutePathForBackupArchive", () => {
    it("encodes Windows absolute paths", () => {
      expect(encodeAbsolutePathForBackupArchive("C:\\Users\\Bob\\app")).toBe("windows/C/Users/Bob/app");
      expect(encodeAbsolutePathForBackupArchive("D:/data/files")).toBe("windows/D/data/files");
    });

    it("encodes POSIX absolute paths", () => {
      expect(encodeAbsolutePathForBackupArchive("/home/alice/app")).toBe("posix/home/alice/app");
      expect(encodeAbsolutePathForBackupArchive("/var/log/syslog")).toBe("posix/var/log/syslog");
    });

    it("encodes relative paths", () => {
      expect(encodeAbsolutePathForBackupArchive("src/app")).toBe("relative/src/app");
      expect(encodeAbsolutePathForBackupArchive("node_modules/lib")).toBe("relative/node_modules/lib");
    });
  });

  describe("buildBackupArchivePath", () => {
    it("constructs full archive payload path", () => {
      const archiveRoot = "backup-root";
      const sourcePath = "/var/log/app.log";
      expect(buildBackupArchivePath(archiveRoot, sourcePath)).toBe("backup-root/payload/posix/var/log/app.log");
    });
  });
});
