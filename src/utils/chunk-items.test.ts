import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("should chunk an array into pieces of the specified size", () => {
    expect(chunkItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("should return the entire array as a single chunk if size <= 0", () => {
    expect(chunkItems([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems([1, 2, 3], -1)).toEqual([[1, 2, 3]]);
  });

  it("should return an empty array if the input array is empty", () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  it("should handle chunk size larger than the array length", () => {
    expect(chunkItems([1, 2], 5)).toEqual([[1, 2]]);
  });
});
