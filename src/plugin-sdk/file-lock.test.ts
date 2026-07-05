import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi, afterEach } from "vitest";

import { acquireFileLock, withFileLock, type FileLockOptions } from "./file-lock.js";

async function withTempFile(fn: (filePath: string) => Promise<void>) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-file-lock-"));
  try {
    await fn(path.join(root, "test-file.txt"));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

const defaultOptions: FileLockOptions = {
  retries: { retries: 2, factor: 1, minTimeout: 10, maxTimeout: 50 },
  stale: 2000,
};

describe("file-lock", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("acquires and releases a lock", async () => {
    await withTempFile(async (filePath) => {
      const lock = await acquireFileLock(filePath, defaultOptions);
      await expect(fs.access(`${filePath}.lock`)).resolves.toBeUndefined();
      await lock.release();
      await expect(fs.access(`${filePath}.lock`)).rejects.toThrow();
    });
  });

  it("prevents concurrent locks", async () => {
    await withTempFile(async (filePath) => {
      const lock1 = await acquireFileLock(filePath, defaultOptions);

      const filePathNew = path.join(path.dirname(filePath), "new.txt");
      await fs.writeFile(`${filePathNew}.lock`, JSON.stringify({ pid: 1234567, createdAt: new Date().toISOString() }), "utf8");

      await expect(
        acquireFileLock(filePathNew, { ...defaultOptions, retries: { ...defaultOptions.retries, retries: 0 } })
      ).rejects.toThrow(/file lock timeout/);

      await lock1.release();
    });
  });

  it("supports reentrant locks", async () => {
    await withTempFile(async (filePath) => {
      const lock1 = await acquireFileLock(filePath, defaultOptions);
      const lock2 = await acquireFileLock(filePath, defaultOptions);

      await lock1.release();
      await expect(fs.access(`${filePath}.lock`)).resolves.toBeUndefined();

      await lock2.release();
      await expect(fs.access(`${filePath}.lock`)).rejects.toThrow();
    });
  });

  it("cleans up handle on writeFile error", async () => {
    await withTempFile(async (filePath) => {
      let handleCloseCalled = false;
      const originalOpen = fs.open;
      vi.spyOn(fs, "open").mockImplementation(async (...args) => {
        const handle = await originalOpen(...args);
        handle.writeFile = async () => {
          throw new Error("Simulated writeFile error");
        };
        const originalClose = handle.close.bind(handle);
        handle.close = async () => {
          handleCloseCalled = true;
          return originalClose();
        };
        return handle;
      });

      await expect(acquireFileLock(filePath, defaultOptions)).rejects.toThrow("Simulated writeFile error");
      expect(handleCloseCalled).toBe(true);
    });
  });

  it("reclaims stale locks", async () => {
    await withTempFile(async (filePath) => {
      const lockPath = `${filePath}.lock`;
      await fs.writeFile(lockPath, JSON.stringify({ pid: 1234567, createdAt: new Date(Date.now() - 5000).toISOString() }), "utf8");

      const lock = await acquireFileLock(filePath, defaultOptions);
      await lock.release();
    });
  });

  it("withFileLock executes and releases lock", async () => {
    await withTempFile(async (filePath) => {
      const result = await withFileLock(filePath, defaultOptions, async () => {
        return "success";
      });
      expect(result).toBe("success");
      await expect(fs.access(`${filePath}.lock`)).rejects.toThrow();
    });
  });
});
