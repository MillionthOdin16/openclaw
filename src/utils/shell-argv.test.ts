import { describe, expect, it } from "vitest";
import { splitShellArgs } from "./shell-argv.js";

describe("splitShellArgs", () => {
  it("handles simple tokens", () => {
    expect(splitShellArgs("foo bar baz")).toEqual(["foo", "bar", "baz"]);
    expect(splitShellArgs("  foo   bar   ")).toEqual(["foo", "bar"]);
  });

  it("handles single quotes", () => {
    expect(splitShellArgs("'foo bar'")).toEqual(["foo bar"]);
    expect(splitShellArgs("foo 'bar baz'")).toEqual(["foo", "bar baz"]);
    expect(splitShellArgs("'foo''bar'")).toEqual(["foobar"]);
  });

  it("handles double quotes", () => {
    expect(splitShellArgs('"foo bar"')).toEqual(["foo bar"]);
    expect(splitShellArgs('foo "bar baz"')).toEqual(["foo", "bar baz"]);
  });

  it("handles escaping outside quotes", () => {
    expect(splitShellArgs("foo\\ bar")).toEqual(["foo bar"]);
    expect(splitShellArgs("foo\\\\bar")).toEqual(["foo\\bar"]);
  });

  it("handles escaping inside double quotes", () => {
    expect(splitShellArgs('"foo \\" bar"')).toEqual(['foo " bar']);
    expect(splitShellArgs('"foo \\\\ bar"')).toEqual(['foo \\ bar']);
    expect(splitShellArgs('"foo \\$ bar"')).toEqual(['foo $ bar']);
    // Inside double quotes, a backslash before an unescapable char is preserved
    expect(splitShellArgs('"foo \\a bar"')).toEqual(['foo \\a bar']);
  });

  it("does not handle escaping inside single quotes", () => {
    expect(splitShellArgs("'foo \\ bar'")).toEqual(['foo \\ bar']);
  });

  it("handles comments", () => {
    expect(splitShellArgs("foo bar # baz qux")).toEqual(["foo", "bar"]);
    expect(splitShellArgs("foo bar#baz")).toEqual(["foo", "bar#baz"]);
    expect(splitShellArgs("'foo # bar'")).toEqual(["foo # bar"]);
    expect(splitShellArgs('"foo # bar"')).toEqual(["foo # bar"]);
  });

  it("handles unclosed quotes and unescaped trailing slash", () => {
    expect(splitShellArgs("'foo bar")).toBeNull();
    expect(splitShellArgs('"foo bar')).toBeNull();
    expect(splitShellArgs("foo \\")).toBeNull();
  });
});
