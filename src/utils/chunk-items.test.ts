import { describe, it, expect } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("should chunk an array into smaller arrays of the specified size", () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    const result = chunkItems(items, 3);
    expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  it("should handle chunking when array size is exactly a multiple of chunk size", () => {
    const items = [1, 2, 3, 4, 5, 6];
    const result = chunkItems(items, 3);
    expect(result).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it("should return a copy of the original array in a single chunk if size <= 0", () => {
    const items = [1, 2, 3];
    const result = chunkItems(items, 0);
    expect(result).toEqual([[1, 2, 3]]);
    expect(result[0]).not.toBe(items); // Ensure it's a copy

    const result2 = chunkItems(items, -1);
    expect(result2).toEqual([[1, 2, 3]]);
  });

  it("should handle empty arrays", () => {
    expect(chunkItems([], 3)).toEqual([]);
  });

  it("should handle chunk size larger than array length", () => {
    const items = [1, 2];
    expect(chunkItems(items, 5)).toEqual([[1, 2]]);
  });
});
