import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("should return an array with a copy of the items when size is <= 0", () => {
    const items = [1, 2, 3];
    const chunked = chunkItems(items, 0);
    expect(chunked).toEqual([[1, 2, 3]]);
    expect(chunked[0]).not.toBe(items); // Ensures it's a copy
  });

  it("should chunk items properly when items length is perfectly divisible by size", () => {
    const items = [1, 2, 3, 4, 5, 6];
    const chunked = chunkItems(items, 2);
    expect(chunked).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });

  it("should chunk items properly when items length is not perfectly divisible by size", () => {
    const items = [1, 2, 3, 4, 5];
    const chunked = chunkItems(items, 2);
    expect(chunked).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("should handle chunk size larger than items length", () => {
    const items = [1, 2, 3];
    const chunked = chunkItems(items, 5);
    expect(chunked).toEqual([[1, 2, 3]]);
  });

  it("should return an empty array when items array is empty", () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  it("should handle size <= 0 with empty arrays", () => {
    expect(chunkItems([], 0)).toEqual([[]]);
    expect(chunkItems([], -1)).toEqual([[]]);
  });
});
