import { describe, expect, it } from "vitest";
import { splitShellArgs } from "./shell-argv.js";

describe("splitShellArgs", () => {
  it("splits simple arguments separated by spaces", () => {
    expect(splitShellArgs("ls -l -a")).toEqual(["ls", "-l", "-a"]);
    expect(splitShellArgs("  echo   hello    world  ")).toEqual(["echo", "hello", "world"]);
  });

  it("handles single quotes", () => {
    expect(splitShellArgs("echo 'hello world'")).toEqual(["echo", "hello world"]);
    expect(splitShellArgs("'spaced arg' 'another one'")).toEqual(["spaced arg", "another one"]);
    expect(splitShellArgs("echo 'has \"double\" quotes'")).toEqual(["echo", 'has "double" quotes']);
  });

  it("handles double quotes", () => {
    expect(splitShellArgs('echo "hello world"')).toEqual(["echo", "hello world"]);
    expect(splitShellArgs('"spaced arg" "another one"')).toEqual(["spaced arg", "another one"]);
    expect(splitShellArgs("echo \"has 'single' quotes\"")).toEqual(["echo", "has 'single' quotes"]);
  });

  it("handles escapes outside quotes", () => {
    expect(splitShellArgs("echo hello\\ world")).toEqual(["echo", "hello world"]);
    expect(splitShellArgs("echo \\'escaped\\'")).toEqual(["echo", "'escaped'"]);
  });

  it("handles escapes inside double quotes", () => {
    expect(splitShellArgs('echo "hello \\"world\\""')).toEqual(["echo", 'hello "world"']);
    expect(splitShellArgs('echo "\\\\ \\$ \\` \\n \\r"')).toEqual(["echo", "\\ $ ` \\n \\r"]);
    // Non-special escapes inside double quotes just preserve the backslash
    expect(splitShellArgs('echo "hello \\world"')).toEqual(["echo", "hello \\world"]);
  });

  it("ignores backslashes as escapes inside single quotes", () => {
    expect(splitShellArgs("echo 'hello \\ world'")).toEqual(["echo", "hello \\ world"]);
    // Since it's inside single quotes, the backslash is literal, not an escape.
    // If there is no closing single quote, the result is unbalanced, so it returns null.
    expect(splitShellArgs("echo 'hello \\")).toBeNull();
  });

  it("handles comments", () => {
    expect(splitShellArgs("echo hello # world")).toEqual(["echo", "hello"]);
    expect(splitShellArgs("echo hello#world")).toEqual(["echo", "hello#world"]); // not start of word
    expect(splitShellArgs('echo "hello # world"')).toEqual(["echo", "hello # world"]); // in quotes
  });

  it("returns null for unbalanced quotes", () => {
    expect(splitShellArgs("echo 'hello")).toBeNull();
    expect(splitShellArgs('echo "hello')).toBeNull();
  });

  it("returns null for trailing escapes", () => {
    expect(splitShellArgs("echo hello \\")).toBeNull();
  });

  it("handles empty strings", () => {
    expect(splitShellArgs("")).toEqual([]);
    expect(splitShellArgs("   ")).toEqual([]);
  });
});
