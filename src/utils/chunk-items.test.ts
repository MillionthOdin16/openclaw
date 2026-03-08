import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items";

describe("chunkItems", () => {
  it("chunks array evenly", () => {
    const items = [1, 2, 3, 4, 5, 6];
    const chunked = chunkItems(items, 2);
    expect(chunked).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });

  it("chunks array with remainder", () => {
    const items = [1, 2, 3, 4, 5];
    const chunked = chunkItems(items, 2);
    expect(chunked).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns original array in a single chunk if size <= 0", () => {
    const items = [1, 2, 3];
    expect(chunkItems(items, 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems(items, -1)).toEqual([[1, 2, 3]]);
  });

  it("handles empty array", () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  it("handles array smaller than chunk size", () => {
    const items = [1, 2];
    expect(chunkItems(items, 5)).toEqual([[1, 2]]);
  });
});
