import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("should return a single chunk for size <= 0", () => {
    expect(chunkItems([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems([1, 2, 3], -1)).toEqual([[1, 2, 3]]);
  });

  it("should chunk items into correct sizes", () => {
    expect(chunkItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkItems([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });

  it("should handle empty arrays", () => {
    expect(chunkItems([], 2)).toEqual([]);
    expect(chunkItems([], 0)).toEqual([[]]);
  });

  it("should return the entire array as one chunk if size >= length", () => {
    expect(chunkItems([1, 2], 5)).toEqual([[1, 2]]);
  });
});
