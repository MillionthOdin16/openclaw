import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("returns original array in a single chunk if size is 0 or negative", () => {
    expect(chunkItems([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems([1, 2, 3], -1)).toEqual([[1, 2, 3]]);
  });

  it("chunks items into correct sizes", () => {
    expect(chunkItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkItems([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });

  it("handles empty arrays", () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  it("handles size larger than array length", () => {
    expect(chunkItems([1, 2], 5)).toEqual([[1, 2]]);
  });
});
