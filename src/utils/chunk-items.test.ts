import { describe, it, expect } from "vitest";
import { chunkItems } from "./chunk-items.ts";

describe("chunkItems", () => {
  it("should return chunked items", () => {
    expect(chunkItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("should handle size <= 0", () => {
    expect(chunkItems([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems([1, 2, 3], -1)).toEqual([[1, 2, 3]]);
  });

  it("should handle empty arrays", () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  it("should handle size greater than array length", () => {
    expect(chunkItems([1, 2], 5)).toEqual([[1, 2]]);
  });
});
