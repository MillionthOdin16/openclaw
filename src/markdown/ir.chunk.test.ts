import { describe, expect, it } from "vitest";
import { chunkMarkdownIR, markdownToIR, markdownToIRWithMeta } from "./ir.js";

describe("chunkMarkdownIR", () => {
  it("returns empty array for empty text", () => {
    expect(chunkMarkdownIR({ text: "", styles: [], links: [] }, 10)).toEqual([]);
  });

  it("returns single chunk if limit is <= 0", () => {
    const ir = { text: "hello", styles: [], links: [] };
    expect(chunkMarkdownIR(ir, 0)).toEqual([ir]);
    expect(chunkMarkdownIR(ir, -5)).toEqual([ir]);
  });

  it("returns single chunk if text length <= limit", () => {
    const ir = { text: "hello", styles: [], links: [] };
    expect(chunkMarkdownIR(ir, 10)).toEqual([ir]);
  });

  it("slices styles correctly", () => {
    const ir = {
      text: "hello world this is long",
      styles: [
        { start: 0, end: 5, style: "bold" as const },
        { start: 6, end: 11, style: "italic" as const },
        { start: 0, end: 11, style: "strikethrough" as const },
      ],
      links: [],
    };

    const chunks = chunkMarkdownIR(ir, 5);

    expect(chunks[0]?.styles).toEqual([
      { start: 0, end: 5, style: "bold" },
      { start: 0, end: 5, style: "strikethrough" },
    ]);

    expect(chunks[1]?.styles).toEqual([
      { start: 0, end: 5, style: "italic" },
      { start: 0, end: 5, style: "strikethrough" },
    ]);
  });

  it("slices links correctly", () => {
    const ir = {
      text: "hello world this is long",
      styles: [],
      links: [
        { start: 0, end: 5, href: "link1" },
        { start: 6, end: 11, href: "link2" },
        { start: 0, end: 11, href: "link3" },
      ],
    };

    const chunks = chunkMarkdownIR(ir, 5);

    expect(chunks[0]?.links).toEqual([
      { start: 0, end: 5, href: "link1" },
      { start: 0, end: 5, href: "link3" },
    ]);

    expect(chunks[1]?.links).toEqual([
      { start: 0, end: 5, href: "link2" },
      { start: 0, end: 5, href: "link3" },
    ]);
  });
});

describe("markdownToIR edge cases", () => {
  it("handles unclosed styles gracefully", () => {
    const ir = markdownToIR("*unclosed?");
    expect(ir.text).toBe("*unclosed?");
  });

  it("handles enableSpoilers", () => {
    const result = markdownToIRWithMeta("||spoiler||", { enableSpoilers: true });
    expect(result.ir.text).toBe("spoiler");
  });

  it("handles HTML blocks and inlines", () => {
    const result = markdownToIR("<div>Hello</div> <span>world</span>");
    expect(result.text).toContain("<div>Hello</div>");
    expect(result.text).toContain("<span>world</span>");
  });
});
