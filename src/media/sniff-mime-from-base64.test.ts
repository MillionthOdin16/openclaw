import { describe, it, expect, vi } from "vitest";
import { sniffMimeFromBase64 } from "./sniff-mime-from-base64.js";

vi.mock("./mime.js", async () => {
  const original = await vi.importActual<typeof import("./mime.js")>("./mime.js");
  return {
    ...original,
    detectMime: vi.fn().mockImplementation((opts) => {
      if (opts.buffer.toString('base64').startsWith('fail')) {
        throw new Error('mock error');
      }
      return original.detectMime(opts);
    })
  };
});

describe("sniffMimeFromBase64", () => {
  it("should return undefined for empty string", async () => {
    expect(await sniffMimeFromBase64("")).toBeUndefined();
    expect(await sniffMimeFromBase64("   ")).toBeUndefined();
  });

  it("should return undefined for short string", async () => {
    expect(await sniffMimeFromBase64("a".repeat(7))).toBeUndefined();
  });

  it("should detect PNG from base64", async () => {
    // PNG signature + IHDR chunk
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    expect(await sniffMimeFromBase64(pngBase64)).toBe("image/png");
  });

  it("should return undefined if detectMime fails", async () => {
    // We mocked detectMime to throw if the buffer starts with "fail"
    expect(await sniffMimeFromBase64("fail".repeat(10))).toBeUndefined();
  });
});
