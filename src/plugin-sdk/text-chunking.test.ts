import { describe, expect, it } from "vitest";
import { chunkTextForOutbound } from "./text-chunking.js";

describe("chunkTextForOutbound", () => {
  it("returns empty for empty input", () => {
    expect(chunkTextForOutbound("", 10)).toEqual([]);
  });

  it("splits on newline or whitespace boundaries", () => {
    expect(chunkTextForOutbound("alpha\nbeta gamma", 8)).toEqual(["alpha", "beta", "gamma"]);
  });

  it("falls back to hard limit when no separator exists", () => {
    expect(chunkTextForOutbound("abcdefghij", 4)).toEqual(["abcd", "efgh", "ij"]);
  });

  it("returns single chunk when length <= limit", () => {
    expect(chunkTextForOutbound("short", 10)).toEqual(["short"]);
  });

  it("trims trailing spaces from chunk", () => {
    expect(chunkTextForOutbound("alpha    beta", 9)).toEqual(["alpha", "beta"]);
  });

  it("ignores empty chunks resulting from trimmed whitespace", () => {
    expect(chunkTextForOutbound("   abc", 3)).toEqual(["abc"]);
  });

  it("does not add remaining if it is empty after trimming", () => {
    expect(chunkTextForOutbound("abc   ", 3)).toEqual(["abc"]);
  });
});
