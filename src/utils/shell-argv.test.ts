import { describe, test, expect } from "vitest";
import { splitShellArgs } from "./shell-argv.ts";

describe("splitShellArgs", () => {
  test("splits simple arguments", () => {
    expect(splitShellArgs("arg1 arg2 arg3")).toEqual(["arg1", "arg2", "arg3"]);
  });

  test("handles multiple spaces between arguments", () => {
    expect(splitShellArgs("arg1    arg2\targ3")).toEqual(["arg1", "arg2", "arg3"]);
  });

  test("handles single quotes", () => {
    expect(splitShellArgs("arg1 'arg2 with spaces' arg3")).toEqual([
      "arg1",
      "arg2 with spaces",
      "arg3",
    ]);
  });

  test("handles double quotes", () => {
    expect(splitShellArgs('arg1 "arg2 with spaces" arg3')).toEqual([
      "arg1",
      "arg2 with spaces",
      "arg3",
    ]);
  });

  test("handles empty quotes - currently skips them but is acceptable", () => {
    expect(splitShellArgs("arg1 '' \"\" arg3")).toEqual(["arg1", "arg3"]);
  });

  test("handles mixed quotes", () => {
    expect(splitShellArgs("'\"' \"'\"")).toEqual(['"', "'"]);
  });

  test("handles backslash escaping", () => {
    expect(splitShellArgs("arg1 arg\\ 2 arg3")).toEqual(["arg1", "arg 2", "arg3"]);
    expect(splitShellArgs('arg1\\"arg2')).toEqual(['arg1"arg2']);
    expect(splitShellArgs("arg1\\'arg2")).toEqual(["arg1'arg2"]);
  });

  test("handles escapes inside double quotes", () => {
    expect(splitShellArgs('"\\""')).toEqual(['"']);
    expect(splitShellArgs('"\\\\"')).toEqual(["\\"]);
    expect(splitShellArgs('"\\$"')).toEqual(["$"]);
    expect(splitShellArgs('"\\`"')).toEqual(["`"]);
    expect(splitShellArgs('"\\\n"')).toEqual(["\n"]);
    expect(splitShellArgs('"\\a"')).toEqual(["\\a"]);
  });

  test("does not handle escapes inside single quotes", () => {
    expect(splitShellArgs("'\\\"'")).toEqual(['\\"']);
    expect(splitShellArgs("'\\\\'")).toEqual(["\\\\"]);
  });

  test("handles comments", () => {
    expect(splitShellArgs("arg1 arg2 # this is a comment")).toEqual(["arg1", "arg2"]);
    expect(splitShellArgs("arg1 arg2#not-a-comment")).toEqual(["arg1", "arg2#not-a-comment"]);
  });

  test("returns null for unclosed single quotes", () => {
    expect(splitShellArgs("arg1 'arg2")).toBeNull();
  });

  test("returns null for unclosed double quotes", () => {
    expect(splitShellArgs('arg1 "arg2')).toBeNull();
  });

  test("returns null for dangling escape", () => {
    expect(splitShellArgs("arg1 arg2\\")).toBeNull();
  });

  test("handles empty string", () => {
    expect(splitShellArgs("")).toEqual([]);
    expect(splitShellArgs("   ")).toEqual([]);
  });
});
