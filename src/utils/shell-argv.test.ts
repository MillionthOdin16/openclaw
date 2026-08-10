import { describe, expect, it } from "vitest";
import { splitShellArgs } from "./shell-argv.ts";

describe("splitShellArgs", () => {
  it("splits simple arguments by space", () => {
    expect(splitShellArgs("a b c")).toEqual(["a", "b", "c"]);
    expect(splitShellArgs("  a   b   c  ")).toEqual(["a", "b", "c"]);
    expect(splitShellArgs("")).toEqual([]);
  });

  it("handles single quotes", () => {
    expect(splitShellArgs("'foo bar' baz")).toEqual(["foo bar", "baz"]);
    expect(splitShellArgs("foo'bar'baz")).toEqual(["foobarbaz"]);
    expect(splitShellArgs("'foo \\'")).toEqual(["foo \\"]); // backslashes in single quotes are literal
  });

  it("handles double quotes", () => {
    expect(splitShellArgs('"foo bar" baz')).toEqual(["foo bar", "baz"]);
    expect(splitShellArgs('foo"bar"baz')).toEqual(["foobarbaz"]);
    expect(splitShellArgs('"foo \\" bar"')).toEqual(['foo " bar']);
    expect(splitShellArgs('"foo \\$ bar"')).toEqual(['foo $ bar']);
    expect(splitShellArgs('"foo \\\\ bar"')).toEqual(['foo \\ bar']);
    expect(splitShellArgs('"foo \\n bar"')).toEqual(['foo \\n bar']);
    expect(splitShellArgs('"foo \\r bar"')).toEqual(['foo \\r bar']);
    expect(splitShellArgs('"foo \\` bar"')).toEqual(['foo ` bar']);
    // escapes that are not double quote escapes are kept with backslash
    expect(splitShellArgs('"foo \\a bar"')).toEqual(['foo \\a bar']);
  });

  it("handles escaping outside quotes", () => {
    expect(splitShellArgs("foo\\ bar baz")).toEqual(["foo bar", "baz"]);
    expect(splitShellArgs("foo\\'bar")).toEqual(["foo'bar"]);
    expect(splitShellArgs("foo\\\"bar")).toEqual(['foo"bar']);
    expect(splitShellArgs("foo\\\\bar")).toEqual(['foo\\bar']);
  });

  it("handles comments", () => {
    expect(splitShellArgs("foo # bar baz")).toEqual(["foo"]);
    expect(splitShellArgs("foo#bar baz")).toEqual(["foo#bar", "baz"]);
    expect(splitShellArgs("foo '# bar'")).toEqual(["foo", "# bar"]);
    expect(splitShellArgs("foo \"# bar\"")).toEqual(["foo", "# bar"]);
  });

  it("returns null on unclosed quotes or trailing escapes", () => {
    expect(splitShellArgs("foo 'bar")).toEqual(null);
    expect(splitShellArgs('foo "bar')).toEqual(null);
    expect(splitShellArgs("foo \\")).toEqual(null);
  });
});
