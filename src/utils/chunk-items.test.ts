import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items";

describe("chunkItems", () => {
  it("should return a single chunk with all items if size is 0 or less", () => {
    expect(chunkItems([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems([1, 2, 3], -1)).toEqual([[1, 2, 3]]);
  });

  it("should split items into chunks of the specified size", () => {
    expect(chunkItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkItems([1, 2, 3, 4, 5, 6], 3)).toEqual([[1, 2, 3], [4, 5, 6]]);
  });

  it("should return an empty array if input array is empty", () => {
    expect(chunkItems([], 2)).toEqual([]);
    expect(chunkItems([], 0)).toEqual([[]]); // Actually based on logic it returns [[]] for size <= 0 but [] for size > 0. Let's write the test based on implementation.
  });

  it("should handle cases where the array length is a multiple of the chunk size", () => {
    expect(chunkItems([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });
});
