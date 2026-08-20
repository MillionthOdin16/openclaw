import { describe, expect, it, vi } from "vitest";
import { extractPdfContent } from "./pdf-extract.js";

vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => {
  return {
    getDocument: () => {
      return {
        promise: Promise.resolve({
          numPages: 2,
          getPage: (pageNum: number) => {
            return Promise.resolve({
              getTextContent: () => Promise.resolve({ items: [{ str: "Test page " + pageNum }] }),
              getViewport: () => ({ width: 100, height: 100 }),
              render: () => ({ promise: Promise.resolve() }),
            });
          }
        })
      };
    }
  };
});

vi.mock("@napi-rs/canvas", () => {
    return {
        createCanvas: () => ({
            getContext: () => ({}),
            toBuffer: () => Buffer.from("fake-png"),
        })
    };
});

describe("extractPdfContent", () => {
  it("extracts text from all pages if text length >= minTextChars", async () => {
    const result = await extractPdfContent({
      buffer: Buffer.from("fake pdf"),
      maxPages: 10,
      maxPixels: 1000,
      minTextChars: 5,
    });
    expect(result.text).toContain("Test page 1");
    expect(result.text).toContain("Test page 2");
    expect(result.images).toHaveLength(0);
  });

  it("falls back to image extraction if text is too short", async () => {
    const result = await extractPdfContent({
      buffer: Buffer.from("fake pdf"),
      maxPages: 10,
      maxPixels: 1000,
      minTextChars: 1000,
    });
    expect(result.text).toContain("Test page 1");
    expect(result.text).toContain("Test page 2");
    expect(result.images).toHaveLength(2);
    expect(result.images[0].type).toBe("image");
    expect(result.images[0].mimeType).toBe("image/png");
    expect(result.images[0].data).toBe(Buffer.from("fake-png").toString("base64"));
  });

  it("respects maxPages", async () => {
    const result = await extractPdfContent({
      buffer: Buffer.from("fake pdf"),
      maxPages: 1,
      maxPixels: 1000,
      minTextChars: 1000,
    });
    expect(result.text).toContain("Test page 1");
    expect(result.text).not.toContain("Test page 2");
    expect(result.images).toHaveLength(1);
  });

  it("respects pageNumbers", async () => {
    const result = await extractPdfContent({
      buffer: Buffer.from("fake pdf"),
      maxPages: 10,
      maxPixels: 1000,
      minTextChars: 1000,
      pageNumbers: [2],
    });
    expect(result.text).not.toContain("Test page 1");
    expect(result.text).toContain("Test page 2");
    expect(result.images).toHaveLength(1);
  });

  it("handles onImageExtractionError when canvas load fails", async () => {
    vi.doMock("@napi-rs/canvas", () => {
      throw new Error("canvas error");
    });
    const onError = vi.fn();
    const { extractPdfContent: isolatedExtract } = await import("./pdf-extract.js?force-reload-1");
    const result = await isolatedExtract({
      buffer: Buffer.from("fake pdf"),
      maxPages: 10,
      maxPixels: 1000,
      minTextChars: 1000,
      onImageExtractionError: onError,
    });
    expect(result.images).toHaveLength(0);
    expect(onError).toHaveBeenCalled();
  });

  it("handles pdfjs module load failure", async () => {
    vi.doMock("pdfjs-dist/legacy/build/pdf.mjs", () => {
      throw new Error("pdfjs load error");
    });
    const { extractPdfContent: isolatedExtract } = await import("./pdf-extract.js?force-reload-2");
    await expect(isolatedExtract({
      buffer: Buffer.from("fake pdf"),
      maxPages: 10,
      maxPixels: 1000,
      minTextChars: 1000,
    })).rejects.toThrow("Optional dependency pdfjs-dist is required for PDF extraction:");
  });

  it("handles out of bound pageNumbers", async () => {
    const result = await extractPdfContent({
      buffer: Buffer.from("fake pdf"),
      maxPages: 10,
      maxPixels: 1000,
      minTextChars: 1000,
      pageNumbers: [0, 3, 1],
    });
    expect(result.text).toContain("Test page 1");
    expect(result.text).not.toContain("Test page 2");
    expect(result.images).toHaveLength(1);
  });

  it("handles non-string textContent items", async () => {
    vi.doMock("pdfjs-dist/legacy/build/pdf.mjs", () => {
      return {
        getDocument: () => {
          return {
            promise: Promise.resolve({
              numPages: 1,
              getPage: (pageNum: number) => {
                return Promise.resolve({
                  getTextContent: () => Promise.resolve({ items: [{ notStr: "Test page " + pageNum }] }),
                  getViewport: () => ({ width: 100, height: 100 }),
                  render: () => ({ promise: Promise.resolve() }),
                });
              }
            })
          };
        }
      };
    });
    const { extractPdfContent: isolatedExtract } = await import("./pdf-extract.js?force-reload-3");
    const result = await isolatedExtract({
      buffer: Buffer.from("fake pdf"),
      maxPages: 10,
      maxPixels: 1000,
      minTextChars: 1000,
    });
    expect(result.text).toBe("");
  });
});
