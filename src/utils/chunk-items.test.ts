import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("should return a single array if size is <= 0", () => {
    expect(chunkItems([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems([1, 2, 3], -1)).toEqual([[1, 2, 3]]);
  });

  it("should split items into chunks of the given size", () => {
    expect(chunkItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkItems([1, 2, 3, 4, 5, 6], 3)).toEqual([[1, 2, 3], [4, 5, 6]]);
  });

  it("should handle empty arrays", () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  it("should handle size larger than the array length", () => {
    expect(chunkItems([1, 2], 5)).toEqual([[1, 2]]);
  });
});
