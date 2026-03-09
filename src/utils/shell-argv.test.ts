import { describe, expect, it } from "vitest";
import { splitShellArgs } from "./shell-argv.ts";

describe("splitShellArgs", () => {
  it("should split space-separated arguments", () => {
    expect(splitShellArgs("cmd arg1 arg2")).toEqual(["cmd", "arg1", "arg2"]);
    expect(splitShellArgs("  cmd   arg1   arg2  ")).toEqual(["cmd", "arg1", "arg2"]);
  });

  it("should handle single-quoted arguments", () => {
    expect(splitShellArgs("cmd 'arg with spaces' arg2")).toEqual(["cmd", "arg with spaces", "arg2"]);
    expect(splitShellArgs("'cmd with space'")).toEqual(["cmd with space"]);
  });

  it("should handle double-quoted arguments", () => {
    expect(splitShellArgs('cmd "arg with spaces" arg2')).toEqual(["cmd", "arg with spaces", "arg2"]);
  });

  it("should handle escaped characters inside double quotes", () => {
    expect(splitShellArgs('cmd "escaped \\" quote"')).toEqual(["cmd", 'escaped " quote']);
    expect(splitShellArgs('cmd "escaped \\$ dollar"')).toEqual(["cmd", "escaped $ dollar"]);
    expect(splitShellArgs('cmd "escaped \\\\ slash"')).toEqual(["cmd", "escaped \\ slash"]);
    expect(splitShellArgs('cmd "escaped \\` tick"')).toEqual(["cmd", "escaped ` tick"]);
    // Unrecognized escapes within double quotes should be kept literally
    expect(splitShellArgs('cmd "escaped \\x slash"')).toEqual(["cmd", "escaped \\x slash"]);
  });

  it("should handle escaped characters outside quotes", () => {
    expect(splitShellArgs("cmd arg\\ with\\ spaces")).toEqual(["cmd", "arg with spaces"]);
    expect(splitShellArgs("cmd arg\\'quote\\'")).toEqual(["cmd", "arg'quote'"]);
    expect(splitShellArgs("cmd arg\\\"quote\\\"")).toEqual(["cmd", 'arg"quote"']);
  });

  it("should handle mixed quotes and concatenated tokens", () => {
    expect(splitShellArgs('cmd "double"\'single\'')).toEqual(["cmd", "doublesingle"]);
    expect(splitShellArgs("cmd 'single'\"double\"")).toEqual(["cmd", "singledouble"]);
    expect(splitShellArgs('cmd no"space"')).toEqual(["cmd", "nospace"]);
  });

  it("should return null for unmatched single quotes", () => {
    expect(splitShellArgs("cmd 'unmatched quote")).toBeNull();
  });

  it("should return null for unmatched double quotes", () => {
    expect(splitShellArgs('cmd "unmatched quote')).toBeNull();
  });

  it("should return null for dangling escapes at the end", () => {
    expect(splitShellArgs("cmd arg \\")).toBeNull();
  });

  it("should return an empty array for empty string", () => {
    expect(splitShellArgs("")).toEqual([]);
    expect(splitShellArgs("   ")).toEqual([]);
  });
});
