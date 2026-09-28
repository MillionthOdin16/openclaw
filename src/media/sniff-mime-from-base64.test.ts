import { describe, it, expect, vi } from "vitest";
import { sniffMimeFromBase64 } from "./sniff-mime-from-base64.js";

// Mock detectMime
vi.mock("./mime.js", () => ({
  detectMime: vi.fn(async ({ buffer }) => {
    // Basic mock implementation for common magic bytes
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return "image/png";
    }
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }
    return undefined;
  }),
}));

describe("sniffMimeFromBase64", () => {
  it("should return undefined for empty string", async () => {
    expect(await sniffMimeFromBase64("")).toBeUndefined();
    expect(await sniffMimeFromBase64("   ")).toBeUndefined();
  });

  it("should return undefined for strings too short", async () => {
    expect(await sniffMimeFromBase64("a")).toBeUndefined();
    expect(await sniffMimeFromBase64("abc")).toBeUndefined();
    expect(await sniffMimeFromBase64("abcd")).toBeUndefined(); // length 4 is less than 8
  });

  it("should detect PNG from base64", async () => {
    // 1x1 transparent PNG
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    expect(await sniffMimeFromBase64(pngBase64)).toBe("image/png");
  });

  it("should detect JPEG from base64", async () => {
    // 1x1 JPEG
    const jpegBase64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
    expect(await sniffMimeFromBase64(jpegBase64)).toBe("image/jpeg");
  });

  it("should handle detectMime throwing an error", async () => {
    const { detectMime } = await import("./mime.js");
    vi.mocked(detectMime).mockRejectedValueOnce(new Error("Network error"));
    // valid base64 but mock will throw
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    expect(await sniffMimeFromBase64(pngBase64)).toBeUndefined();
  });
});
