import { describe, expect, it } from "vitest";
import {
  extractThinkDirective,
  extractVerboseDirective,
  extractNoticeDirective,
  extractElevatedDirective,
  extractReasoningDirective,
  extractStatusDirective,
} from "./directives.js";

describe("extractThinkDirective", () => {
  it("returns defaults for empty body", () => {
    expect(extractThinkDirective("")).toEqual({ cleaned: "", hasDirective: false });
    expect(extractThinkDirective(undefined)).toEqual({ cleaned: "", hasDirective: false });
  });

  it("extracts directive without args", () => {
    const result = extractThinkDirective("hello /think world");
    expect(result.hasDirective).toBe(true);
    expect(result.cleaned).toBe("hello world");
    expect(result.rawLevel).toBeUndefined();
  });

  it("extracts directive with args", () => {
    const result = extractThinkDirective("/think:on some text");
    expect(result.hasDirective).toBe(true);
    expect(result.cleaned).toBe("some text");
    expect(result.rawLevel).toBe("on");
    expect(result.thinkLevel).toBe("low");
  });

  it("handles spaces around colon", () => {
    const result = extractThinkDirective("text /think : off");
    expect(result.hasDirective).toBe(true);
    expect(result.cleaned).toBe("text");
    expect(result.rawLevel).toBe("off");
    expect(result.thinkLevel).toBe("off");
  });

  it("handles alternative names", () => {
    const result = extractThinkDirective("/t:auto message");
    expect(result.hasDirective).toBe(true);
    expect(result.cleaned).toBe("message");
    expect(result.rawLevel).toBe("auto");
  });
});

describe("extractVerboseDirective", () => {
  it("extracts verbose directive", () => {
    const result = extractVerboseDirective("/verbose:high hello");
    expect(result.hasDirective).toBe(true);
    expect(result.cleaned).toBe("hello");
    expect(result.rawLevel).toBe("high");
  });

  it("handles empty body", () => {
    expect(extractVerboseDirective("")).toEqual({ cleaned: "", hasDirective: false });
  });
});

describe("extractNoticeDirective", () => {
  it("extracts notice directive", () => {
    const result = extractNoticeDirective("/notices:off test");
    expect(result.hasDirective).toBe(true);
    expect(result.cleaned).toBe("test");
    expect(result.rawLevel).toBe("off");
  });

  it("handles empty body", () => {
    expect(extractNoticeDirective("")).toEqual({ cleaned: "", hasDirective: false });
  });
});

describe("extractElevatedDirective", () => {
  it("extracts elevated directive", () => {
    const result = extractElevatedDirective("/elevated:true command");
    expect(result.hasDirective).toBe(true);
    expect(result.cleaned).toBe("command");
    expect(result.rawLevel).toBe("true");
  });

  it("handles empty body", () => {
    expect(extractElevatedDirective("")).toEqual({ cleaned: "", hasDirective: false });
  });
});

describe("extractReasoningDirective", () => {
  it("extracts reasoning directive", () => {
    const result = extractReasoningDirective("/reasoning:high arg");
    expect(result.hasDirective).toBe(true);
    expect(result.cleaned).toBe("arg");
    expect(result.rawLevel).toBe("high");
  });

  it("handles empty body", () => {
    expect(extractReasoningDirective("")).toEqual({ cleaned: "", hasDirective: false });
  });
});

describe("extractStatusDirective", () => {
  it("extracts status directive", () => {
    const result = extractStatusDirective("/status hello");
    expect(result.hasDirective).toBe(true);
    expect(result.cleaned).toBe("hello");
  });

  it("extracts status directive with colon", () => {
    const result = extractStatusDirective("/status: hello");
    expect(result.hasDirective).toBe(true);
    expect(result.cleaned).toBe("hello");
  });

  it("handles empty body", () => {
    expect(extractStatusDirective("")).toEqual({ cleaned: "", hasDirective: false });
  });
});
