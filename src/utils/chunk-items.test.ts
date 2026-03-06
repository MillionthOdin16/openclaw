import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("chunks array into specified sizes", () => {
    const items = [1, 2, 3, 4, 5];
    const chunks = chunkItems(items, 2);
    expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("handles exact multiples of chunk size", () => {
    const items = [1, 2, 3, 4, 5, 6];
    const chunks = chunkItems(items, 3);
    expect(chunks).toEqual([[1, 2, 3], [4, 5, 6]]);
  });

  it("returns single chunk when size is larger than array length", () => {
    const items = [1, 2, 3];
    const chunks = chunkItems(items, 5);
    expect(chunks).toEqual([[1, 2, 3]]);
  });

  it("handles empty array", () => {
    const chunks = chunkItems([], 2);
    expect(chunks).toEqual([]);
  });

  it("returns single chunk (original array) when size is zero or negative", () => {
    const items = [1, 2, 3];
    expect(chunkItems(items, 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems(items, -1)).toEqual([[1, 2, 3]]);
  });
});
