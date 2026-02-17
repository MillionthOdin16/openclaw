import { describe, expect, it } from "vitest";
import { formatLinkUnderstandingBody } from "./format.js";

describe("formatLinkUnderstandingBody", () => {
  it("returns body if outputs is empty", () => {
    const result = formatLinkUnderstandingBody({
      body: "original body",
      outputs: [],
    });
    expect(result).toBe("original body");
  });

  it("returns empty string if body and outputs are empty", () => {
    const result = formatLinkUnderstandingBody({
      body: "",
      outputs: [],
    });
    expect(result).toBe("");
  });

  it("returns joined outputs if body is missing", () => {
    const result = formatLinkUnderstandingBody({
      outputs: ["output 1", "output 2"],
    });
    expect(result).toBe("output 1\noutput 2");
  });

  it("returns joined outputs if body is empty", () => {
    const result = formatLinkUnderstandingBody({
      body: "   ",
      outputs: ["output 1", "output 2"],
    });
    expect(result).toBe("output 1\noutput 2");
  });

  it("returns body and outputs separated by double newline", () => {
    const result = formatLinkUnderstandingBody({
      body: "original body",
      outputs: ["output 1"],
    });
    expect(result).toBe("original body\n\noutput 1");
  });

  it("filters empty outputs", () => {
    const result = formatLinkUnderstandingBody({
      body: "original body",
      outputs: ["", "output 1", "   ", "output 2"],
    });
    expect(result).toBe("original body\n\noutput 1\noutput 2");
  });

  it("trims outputs", () => {
    const result = formatLinkUnderstandingBody({
      body: "original body",
      outputs: ["  output 1  "],
    });
    expect(result).toBe("original body\n\noutput 1");
  });
});
