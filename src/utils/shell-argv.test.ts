import { describe, expect, it } from "vitest";
import { splitShellArgs } from "./shell-argv.js";

describe("splitShellArgs", () => {
  it("splits simple arguments", () => {
    expect(splitShellArgs("ls -la")).toEqual(["ls", "-la"]);
    expect(splitShellArgs("  echo   hello   world  ")).toEqual(["echo", "hello", "world"]);
  });

  it("handles single quotes", () => {
    expect(splitShellArgs("echo 'hello world'")).toEqual(["echo", "hello world"]);
    expect(splitShellArgs("'single quoted'")).toEqual(["single quoted"]);
  });

  it("handles double quotes", () => {
    expect(splitShellArgs('echo "hello world"')).toEqual(["echo", "hello world"]);
    expect(splitShellArgs('"double quoted"')).toEqual(["double quoted"]);
  });

  it("handles escapes outside of quotes", () => {
    expect(splitShellArgs('echo \\"escaped\\"')).toEqual(["echo", '"escaped"']);
    expect(splitShellArgs("echo hello\\ world")).toEqual(["echo", "hello world"]);
  });

  it("handles escapes inside double quotes", () => {
    // Escaping a quote
    expect(splitShellArgs('echo "hello \\"world\\""')).toEqual(["echo", 'hello "world"']);
    // Escaping a backslash
    expect(splitShellArgs('echo "a \\\\ b"')).toEqual(["echo", "a \\ b"]);
    // Escaping a dollar sign
    expect(splitShellArgs('echo "\\$VAR"')).toEqual(["echo", "$VAR"]);
    // Non-escapable character inside double quotes is just treated as backslash + char
    expect(splitShellArgs('echo "\\n"')).toEqual(["echo", "\\n"]);
    // A backslash followed by a non-special char just outputs the backslash and the char
    expect(splitShellArgs('echo "\\x"')).toEqual(["echo", "\\x"]);
  });

  it("ignores comments", () => {
    expect(splitShellArgs("echo hello # this is a comment")).toEqual(["echo", "hello"]);
    expect(splitShellArgs("echo hello#world")).toEqual(["echo", "hello#world"]); // # must be at start of word
  });

  it("returns null on unbalanced quotes or trailing escape", () => {
    expect(splitShellArgs("echo 'hello")).toBeNull();
    expect(splitShellArgs('echo "hello')).toBeNull();
    expect(splitShellArgs("echo hello\\")).toBeNull();
  });
});
