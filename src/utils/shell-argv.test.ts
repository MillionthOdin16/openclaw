import { describe, expect, it } from "vitest";
import { splitShellArgs } from "./shell-argv.js";

describe("splitShellArgs", () => {
  it("splits simple arguments", () => {
    expect(splitShellArgs("foo bar baz")).toEqual(["foo", "bar", "baz"]);
  });

  it("handles single quotes", () => {
    expect(splitShellArgs("foo 'bar baz' qux")).toEqual(["foo", "bar baz", "qux"]);
    expect(splitShellArgs("'foo bar'")).toEqual(["foo bar"]);
  });

  it("handles double quotes", () => {
    expect(splitShellArgs('foo "bar baz" qux')).toEqual(["foo", "bar baz", "qux"]);
    expect(splitShellArgs('"foo bar"')).toEqual(["foo bar"]);
  });

  it("handles escaped characters", () => {
    expect(splitShellArgs("foo\\ bar")).toEqual(["foo bar"]);
    expect(splitShellArgs("foo\\\\bar")).toEqual(["foo\\bar"]);
  });

  it("handles escapes inside double quotes", () => {
    expect(splitShellArgs('"foo \\"bar\\" baz"')).toEqual(['foo "bar" baz']);
    expect(splitShellArgs('"foo \\\\ bar"')).toEqual(['foo \\ bar']);
    expect(splitShellArgs('"foo \\$ bar"')).toEqual(['foo $ bar']);
    expect(splitShellArgs('"foo \\` bar"')).toEqual(['foo ` bar']);
    expect(splitShellArgs('"foo \\\n bar"')).toEqual(['foo \n bar']);
    // Non-special chars shouldn't consume the backslash
    expect(splitShellArgs('"foo \\a bar"')).toEqual(['foo \\a bar']);
  });

  it("ignores escapes inside single quotes", () => {
    expect(splitShellArgs("'foo \\n bar'")).toEqual(['foo \\n bar']);
    // In POSIX shell, a backslash inside single quotes is just a literal backslash.
    // The sequence `'foo \'` means a single-quoted string containing `foo \`.
    // It is perfectly valid and CLOSED if it ends there.
    expect(splitShellArgs("'foo \\'")).toEqual(['foo \\']);
  });

  it("handles comments", () => {
    expect(splitShellArgs("foo bar # comment")).toEqual(["foo", "bar"]);
    expect(splitShellArgs("foo bar#not-comment")).toEqual(["foo", "bar#not-comment"]);
    expect(splitShellArgs("foo 'bar # comment'")).toEqual(["foo", "bar # comment"]);
  });

  it("returns null on unclosed single quotes", () => {
    expect(splitShellArgs("foo 'bar baz")).toBeNull();
  });

  it("returns null on unclosed double quotes", () => {
    expect(splitShellArgs('foo "bar baz')).toBeNull();
  });

  it("returns null on dangling escape", () => {
    expect(splitShellArgs("foo bar\\")).toBeNull();
  });

  it("handles multiple spaces and newlines", () => {
    expect(splitShellArgs("  foo \n\t bar  \n")).toEqual(["foo", "bar"]);
  });
});
