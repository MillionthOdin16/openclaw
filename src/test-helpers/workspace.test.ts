import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { makeTempWorkspace, writeWorkspaceFile } from "./workspace.js";

describe("makeTempWorkspace", () => {
  it("creates a temporary directory with the default prefix", async () => {
    const dir = await makeTempWorkspace();
    expect(dir).toContain("openclaw-workspace-");
    expect(dir).toContain(os.tmpdir());

    const stats = await fs.stat(dir);
    expect(stats.isDirectory()).toBe(true);

    // cleanup
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("creates a temporary directory with a custom prefix", async () => {
    const customPrefix = "custom-test-prefix-";
    const dir = await makeTempWorkspace(customPrefix);
    expect(dir).toContain(customPrefix);

    const stats = await fs.stat(dir);
    expect(stats.isDirectory()).toBe(true);

    // cleanup
    await fs.rm(dir, { recursive: true, force: true });
  });
});

describe("writeWorkspaceFile", () => {
  it("writes content to a file in the workspace", async () => {
    const dir = await makeTempWorkspace();
    const fileName = "test-file.txt";
    const content = "Hello World";

    const filePath = await writeWorkspaceFile({ dir, name: fileName, content });

    expect(filePath).toBe(path.join(dir, fileName));

    const fileContent = await fs.readFile(filePath, "utf-8");
    expect(fileContent).toBe(content);

    // cleanup
    await fs.rm(dir, { recursive: true, force: true });
  });
});
