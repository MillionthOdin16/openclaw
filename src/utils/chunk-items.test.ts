import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("chunks an array into smaller arrays of the given size", () => {
    expect(chunkItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkItems([1, 2, 3, 4, 5, 6], 3)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it("returns a single chunk if the size is larger than the array length", () => {
    expect(chunkItems([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
  });

  it("returns an empty array if the input array is empty", () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  it("returns a single chunk with all items if size is 0 or negative", () => {
    expect(chunkItems([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems([1, 2, 3], -1)).toEqual([[1, 2, 3]]);
  });

  it("does not mutate the original array", () => {
    const arr = [1, 2, 3];
    chunkItems(arr, 2);
    expect(arr).toEqual([1, 2, 3]);
  });
});
