import { describe, expect, it } from "vitest";
import { parseBooleanValue } from "./boolean.js";
import { chunkItems } from "./chunk-items.js";
import { isReasoningTagProvider } from "./provider-utils.js";
import { safeJsonStringify } from "./safe-json.js";
import { splitShellArgs } from "./shell-argv.js";
import { withTimeout } from "./with-timeout.js";

describe("parseBooleanValue", () => {
  it("handles boolean inputs", () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("parses default truthy/falsy strings", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
  });

  it("respects custom truthy/falsy lists", () => {
    expect(
      parseBooleanValue("on", {
        truthy: ["true"],
        falsy: ["false"],
      }),
    ).toBeUndefined();
    expect(
      parseBooleanValue("yes", {
        truthy: ["yes"],
        falsy: ["no"],
      }),
    ).toBe(true);
  });

  it("returns undefined for unsupported values", () => {
    expect(parseBooleanValue("")).toBeUndefined();
    expect(parseBooleanValue("maybe")).toBeUndefined();
    expect(parseBooleanValue(1)).toBeUndefined();
  });
});

describe("isReasoningTagProvider", () => {
  const cases: Array<{
    name: string;
    value: string | null | undefined;
    expected: boolean;
  }> = [
    {
      name: "returns false for ollama - native reasoning field, no tags needed (#2279)",
      value: "ollama",
      expected: false,
    },
    {
      name: "returns false for case-insensitive ollama",
      value: "Ollama",
      expected: false,
    },
    {
      name: "returns true for google (gemini-api-key auth provider)",
      value: "google",
      expected: true,
    },
    {
      name: "returns true for Google (case-insensitive)",
      value: "Google",
      expected: true,
    },
    { name: "returns true for google-gemini-cli", value: "google-gemini-cli", expected: true },
    {
      name: "returns true for google-generative-ai",
      value: "google-generative-ai",
      expected: true,
    },
    { name: "returns true for minimax", value: "minimax", expected: true },
    { name: "returns true for minimax-cn", value: "minimax-cn", expected: true },
    { name: "returns false for null", value: null, expected: false },
    { name: "returns false for undefined", value: undefined, expected: false },
    { name: "returns false for empty", value: "", expected: false },
    { name: "returns false for anthropic", value: "anthropic", expected: false },
    { name: "returns false for openai", value: "openai", expected: false },
    { name: "returns false for openrouter", value: "openrouter", expected: false },
  ];

  for (const testCase of cases) {
    it(testCase.name, () => {
      expect(isReasoningTagProvider(testCase.value)).toBe(testCase.expected);
    });
  }
});

describe("splitShellArgs", () => {
  it("splits whitespace and respects quotes", () => {
    expect(splitShellArgs(`qmd --foo "bar baz"`)).toEqual(["qmd", "--foo", "bar baz"]);
    expect(splitShellArgs(`qmd --foo 'bar baz'`)).toEqual(["qmd", "--foo", "bar baz"]);
  });

  it("supports backslash escapes inside double quotes", () => {
    expect(splitShellArgs(String.raw`echo "a\"b"`)).toEqual(["echo", `a"b`]);
    expect(splitShellArgs(String.raw`echo "\$HOME"`)).toEqual(["echo", "$HOME"]);
  });

  it("returns null for unterminated quotes", () => {
    expect(splitShellArgs(`echo "oops`)).toBeNull();
    expect(splitShellArgs(`echo 'oops`)).toBeNull();
  });

  it("stops at unquoted shell comments but keeps quoted hashes literal", () => {
    expect(splitShellArgs(`echo hi # comment && whoami`)).toEqual(["echo", "hi"]);
    expect(splitShellArgs(`echo "hi # still-literal"`)).toEqual(["echo", "hi # still-literal"]);
    expect(splitShellArgs(`echo hi#tail`)).toEqual(["echo", "hi#tail"]);
  });

  it("handles unquoted backslash escapes correctly", () => {
    expect(splitShellArgs(`echo \\"test\\"`)).toEqual(["echo", `"test"`]);
    expect(splitShellArgs(`echo a\\ b`)).toEqual(["echo", `a b`]);
  });

  it("returns null for trailing unquoted backslash", () => {
    expect(splitShellArgs(`echo a\\`)).toBeNull();
  });
});

describe("chunkItems", () => {
  it("chunks items into specified size", () => {
    expect(chunkItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkItems([1, 2, 3, 4, 5], 3)).toEqual([
      [1, 2, 3],
      [4, 5],
    ]);
    expect(chunkItems([1, 2, 3, 4, 5], 5)).toEqual([[1, 2, 3, 4, 5]]);
    expect(chunkItems([1, 2, 3, 4, 5], 10)).toEqual([[1, 2, 3, 4, 5]]);
  });

  it("handles empty arrays", () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  it("handles invalid size by returning the whole array", () => {
    expect(chunkItems([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems([1, 2, 3], -1)).toEqual([[1, 2, 3]]);
  });
});

describe("safeJsonStringify", () => {
  it("stringifies primitives", () => {
    expect(safeJsonStringify(1)).toBe("1");
    expect(safeJsonStringify("test")).toBe('"test"');
    expect(safeJsonStringify(null)).toBe("null");
    expect(safeJsonStringify(true)).toBe("true");
  });

  it("handles objects and arrays", () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
    expect(safeJsonStringify([1, 2])).toBe("[1,2]");
  });

  it("converts bigint to string", () => {
    expect(safeJsonStringify({ val: 1n })).toBe('{"val":"1"}');
  });

  it("converts functions to string", () => {
    expect(safeJsonStringify({ val: () => {} })).toBe('{"val":"[Function]"}');
  });

  it("converts Error objects", () => {
    const err = new Error("test error");
    const json = safeJsonStringify(err);
    expect(json).toContain('"name":"Error"');
    expect(json).toContain('"message":"test error"');
  });

  it("converts Uint8Array to base64", () => {
    const arr = new Uint8Array([1, 2, 3]);
    const json = safeJsonStringify(arr);
    expect(json).toContain('"type":"Uint8Array"');
    expect(json).toContain('"data":"AQID"');
  });

  it("returns null for circular references", () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });
});

describe("withTimeout", () => {
  it("resolves if promise resolves before timeout", async () => {
    const promise = Promise.resolve("success");
    await expect(withTimeout(promise, 1000)).resolves.toBe("success");
  });

  it("rejects if promise rejects before timeout", async () => {
    const promise = Promise.reject(new Error("failure"));
    await expect(withTimeout(promise, 1000)).rejects.toThrow("failure");
  });

  it("rejects with timeout error if promise takes too long", async () => {
    const promise = new Promise((resolve) => setTimeout(resolve, 1000));
    await expect(withTimeout(promise, 10)).rejects.toThrow("timeout");
  });

  it("returns original promise if timeout is 0 or negative", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("done"), 50));
    await expect(withTimeout(promise, 0)).resolves.toBe("done");
    const promise2 = new Promise((resolve) => setTimeout(() => resolve("done2"), 50));
    await expect(withTimeout(promise2, -100)).resolves.toBe("done2");
  });
});
