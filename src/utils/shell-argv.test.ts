import { describe, it, expect } from "vitest";
import { splitShellArgs } from "./shell-argv.ts";

describe("splitShellArgs", () => {
  it("should split space separated arguments", () => {
    expect(splitShellArgs("foo bar baz")).toEqual(["foo", "bar", "baz"]);
  });

  it("should handle single quotes", () => {
    expect(splitShellArgs("foo 'bar baz'")).toEqual(["foo", "bar baz"]);
  });

  it("should handle double quotes", () => {
    expect(splitShellArgs('foo "bar baz"')).toEqual(["foo", "bar baz"]);
  });

  it("should handle escaped characters outside quotes", () => {
    expect(splitShellArgs("foo\\ bar")).toEqual(["foo bar"]);
  });

  it("should handle escaped quotes inside double quotes", () => {
    expect(splitShellArgs('foo "bar \\"baz\\""')).toEqual(["foo", 'bar "baz"']);
  });

  it("should not escape inside single quotes", () => {
    expect(splitShellArgs("'foo \\'bar'")).toEqual(null); // invalid because \' is literal \ and ends quote
  });

  it("should return null for unclosed quotes", () => {
    expect(splitShellArgs("foo 'bar baz")).toEqual(null);
    expect(splitShellArgs('foo "bar baz')).toEqual(null);
  });

  it("should handle comments", () => {
    expect(splitShellArgs("foo bar # baz")).toEqual(["foo", "bar"]);
    expect(splitShellArgs("foo bar#baz")).toEqual(["foo", "bar#baz"]);
  });

  it("should handle empty string", () => {
    expect(splitShellArgs("")).toEqual([]);
  });

  it("should return null for trailing escape", () => {
    expect(splitShellArgs("foo bar \\")).toEqual(null);
  });
});
