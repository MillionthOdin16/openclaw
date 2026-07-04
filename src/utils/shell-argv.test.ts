import { describe, expect, it } from "vitest";
import { splitShellArgs } from "./shell-argv.js";

describe("splitShellArgs - additional coverage", () => {
  it("handles outer backslash escapes", () => {
    expect(splitShellArgs("echo \\a b \\'c\\'")).toEqual(["echo", "a", "b", "'c'"]);
  });
});
