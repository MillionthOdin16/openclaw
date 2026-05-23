import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readJsonFile, writeJsonAtomic, writeTextAtomic, createAsyncLock } from "./json-files.js";

describe("json-files", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "json-files-test-"));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("readJsonFile", () => {
    it("should read and parse valid JSON", async () => {
      const file = path.join(tempDir, "data.json");
      const data = { key: "value" };
      await fs.writeFile(file, JSON.stringify(data), "utf8");
      const result = await readJsonFile(file);
      expect(result).toEqual(data);
    });

    it("should return null for non-existent file", async () => {
      const file = path.join(tempDir, "missing.json");
      const result = await readJsonFile(file);
      expect(result).toBeNull();
    });

    it("should return null for invalid JSON", async () => {
      const file = path.join(tempDir, "invalid.json");
      await fs.writeFile(file, "{ invalid: true }", "utf8");
      const result = await readJsonFile(file);
      expect(result).toBeNull();
    });
  });

  describe("writeTextAtomic", () => {
    it("should write text atomically", async () => {
      const file = path.join(tempDir, "text.txt");
      await writeTextAtomic(file, "hello world");
      const content = await fs.readFile(file, "utf8");
      expect(content).toBe("hello world");
    });

    it("should append trailing newline if requested", async () => {
      const file = path.join(tempDir, "newline.txt");
      await writeTextAtomic(file, "line", { appendTrailingNewline: true });
      const content = await fs.readFile(file, "utf8");
      expect(content).toBe("line\n");
    });

    it("should not append trailing newline if already present", async () => {
      const file = path.join(tempDir, "newline2.txt");
      await writeTextAtomic(file, "line\n", { appendTrailingNewline: true });
      const content = await fs.readFile(file, "utf8");
      expect(content).toBe("line\n");
    });

    it("should use specified mode", async () => {
      const file = path.join(tempDir, "mode.txt");
      await writeTextAtomic(file, "content", { mode: 0o644 });
      const stat = await fs.stat(file);
      // Stat mode includes file type; bitwise AND to extract permissions
      expect(stat.mode & 0o777).toBe(0o644);
    });

    it("should handle nested directories with ensureDirMode", async () => {
      const file = path.join(tempDir, "nested", "dir", "file.txt");
      await writeTextAtomic(file, "nested content", { ensureDirMode: 0o755 });
      const content = await fs.readFile(file, "utf8");
      expect(content).toBe("nested content");
      const dirStat = await fs.stat(path.dirname(file));
      expect(dirStat.mode & 0o777).toBe(0o755);
    });

    it("should ignore errors during temporary file deletion", async () => {
      const file = path.join(tempDir, "rm-error.txt");
      vi.spyOn(fs, "rm").mockRejectedValue(new Error("mock rm error"));
      // It should complete successfully despite the mocked error
      await writeTextAtomic(file, "content");
      const content = await fs.readFile(file, "utf8");
      expect(content).toBe("content");
    });
  });

  describe("writeJsonAtomic", () => {
    it("should write JSON formatted atomically", async () => {
      const file = path.join(tempDir, "data.json");
      const data = { a: 1, b: "two" };
      await writeJsonAtomic(file, data);
      const content = await fs.readFile(file, "utf8");
      expect(content).toBe(JSON.stringify(data, null, 2));
    });

    it("should pass options to writeTextAtomic", async () => {
      const file = path.join(tempDir, "data-options.json");
      const data = { x: 10 };
      await writeJsonAtomic(file, data, { trailingNewline: true });
      const content = await fs.readFile(file, "utf8");
      expect(content).toBe(JSON.stringify(data, null, 2) + "\n");
    });
  });

  describe("createAsyncLock", () => {
    it("should ensure sequential execution", async () => {
      const withLock = createAsyncLock();
      const events: number[] = [];

      const task1 = withLock(async () => {
        events.push(1);
        await new Promise((resolve) => setTimeout(resolve, 50));
        events.push(2);
      });

      const task2 = withLock(async () => {
        events.push(3);
        await new Promise((resolve) => setTimeout(resolve, 10));
        events.push(4);
      });

      await Promise.all([task1, task2]);

      // Task 2 should wait for Task 1 to finish entirely before starting.
      expect(events).toEqual([1, 2, 3, 4]);
    });

    it("should unlock even if a task throws", async () => {
      const withLock = createAsyncLock();
      const events: number[] = [];

      const task1 = withLock(async () => {
        events.push(1);
        throw new Error("fail");
      });

      const task2 = withLock(async () => {
        events.push(2);
      });

      await expect(task1).rejects.toThrow("fail");
      await task2;

      expect(events).toEqual([1, 2]);
    });
  });
});
