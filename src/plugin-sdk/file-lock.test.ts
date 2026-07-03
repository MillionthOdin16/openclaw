import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it, describe, vi } from "vitest";
import { acquireFileLock } from "./file-lock.js";

describe("acquireFileLock", () => {
  it("closes handle and removes lock file if writeFile fails after open", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-file-lock-"));
    const lockTarget = path.join(root, "target.txt");
    const lockPath = `${lockTarget}.lock`;

    // We need to spy on the instance, so let's mock fs.open instead.
    const originalOpen = fs.open;
    const openSpy = vi.spyOn(fs, "open").mockImplementation(async (path, flags, mode) => {
      const handle = await originalOpen(path, flags, mode);
      vi.spyOn(handle, "writeFile").mockRejectedValue(new Error("Disk full"));
      vi.spyOn(handle, "close");
      return handle;
    });

    try {
      await expect(
        acquireFileLock(lockTarget, {
          retries: { retries: 0, factor: 1, minTimeout: 10, maxTimeout: 10 },
          stale: 1000,
        }),
      ).rejects.toThrow("Disk full");

      expect(openSpy).toHaveBeenCalled();
      // Since open is mocked, we need to inspect the handle it returns
      const handle = await openSpy.mock.results[0].value;
      expect(handle.writeFile).toHaveBeenCalled();
      expect(handle.close).toHaveBeenCalled();
      await expect(fs.access(lockPath)).rejects.toThrow();
    } finally {
      openSpy.mockRestore();
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
