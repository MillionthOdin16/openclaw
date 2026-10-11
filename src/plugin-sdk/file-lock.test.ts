import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { acquireFileLock, withFileLock } from "./file-lock.js";

describe("file-lock", () => {
  let tempDir: string;
  const options = {
    retries: { retries: 2, factor: 1, minTimeout: 10, maxTimeout: 20 },
    stale: 1000,
  };

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "file-lock-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("should acquire a lock and release it", async () => {
    const lockPath = path.join(tempDir, "test.txt");
    const lock = await acquireFileLock(lockPath, options);

    // Check lock file is created
    const lockFilePath = lockPath + ".lock";
    const stat = await fs.stat(lockFilePath);
    expect(stat.isFile()).toBe(true);

    const content = await fs.readFile(lockFilePath, "utf8");
    const parsed = JSON.parse(content);
    expect(parsed.pid).toBe(process.pid);
    expect(typeof parsed.createdAt).toBe("string");

    await lock.release();

    // Check lock file is removed
    await expect(fs.stat(lockFilePath)).rejects.toThrow("ENOENT");
  });

  it("should support reentrancy", async () => {
    const lockPath = path.join(tempDir, "reentrant.txt");
    const lock1 = await acquireFileLock(lockPath, options);
    const lock2 = await acquireFileLock(lockPath, options);

    const lockFilePath = lockPath + ".lock";
    const stat = await fs.stat(lockFilePath);
    expect(stat.isFile()).toBe(true);

    await lock1.release();

    // Lock file should still exist
    const stat2 = await fs.stat(lockFilePath);
    expect(stat2.isFile()).toBe(true);

    await lock2.release();

    // Lock file should be removed
    await expect(fs.stat(lockFilePath)).rejects.toThrow("ENOENT");
  });

  it("should throw after retries if locked", async () => {
    const lockPath = path.join(tempDir, "timeout.txt");
    const lockFilePath = lockPath + ".lock";

    // Manually create lock file simulating another process
    await fs.writeFile(lockFilePath, JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));

    const timeoutOptions = {
      retries: { retries: 1, factor: 1, minTimeout: 10, maxTimeout: 10 },
      stale: 5000,
    };

    await expect(acquireFileLock(lockPath, timeoutOptions)).rejects.toThrow(/file lock timeout/);
  });

  it("should override stale lock", async () => {
    const lockPath = path.join(tempDir, "stale.txt");
    const lockFilePath = lockPath + ".lock";

    // Manually create an old lock file
    const oldDate = new Date(Date.now() - 2000).toISOString();
    await fs.writeFile(lockFilePath, JSON.stringify({ pid: 999999999, createdAt: oldDate }));

    const lock = await acquireFileLock(lockPath, {
      ...options,
      stale: 1000
    });

    expect(lock).toBeDefined();

    const content = await fs.readFile(lockFilePath, "utf8");
    const parsed = JSON.parse(content);
    expect(parsed.pid).toBe(process.pid); // Replaced with current pid

    await lock.release();
  });

  it("withFileLock should acquire, run fn, and release", async () => {
    const lockPath = path.join(tempDir, "with.txt");
    let executed = false;

    const result = await withFileLock(lockPath, options, async () => {
      executed = true;
      const lockFilePath = lockPath + ".lock";
      const stat = await fs.stat(lockFilePath);
      expect(stat.isFile()).toBe(true);
      return "done";
    });

    expect(executed).toBe(true);
    expect(result).toBe("done");

    // Check lock file is removed
    const lockFilePath = lockPath + ".lock";
    await expect(fs.stat(lockFilePath)).rejects.toThrow("ENOENT");
  });

  it("withFileLock should release even if fn throws", async () => {
    const lockPath = path.join(tempDir, "with-throw.txt");

    await expect(withFileLock(lockPath, options, async () => {
      throw new Error("Oops");
    })).rejects.toThrow("Oops");

    // Check lock file is removed
    const lockFilePath = lockPath + ".lock";
    await expect(fs.stat(lockFilePath)).rejects.toThrow("ENOENT");
  });
});
