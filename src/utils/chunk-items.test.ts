import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("chunks items into smaller arrays", () => {
    expect(chunkItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("handles empty arrays", () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  it("handles size <= 0 by returning the whole array in a single chunk", () => {
    expect(chunkItems([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems([1, 2, 3], -1)).toEqual([[1, 2, 3]]);
  });

  it("handles size larger than array length", () => {
    expect(chunkItems([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
  });
});
