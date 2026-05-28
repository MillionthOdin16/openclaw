import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("chunks an array into smaller arrays of specified size", () => {
    expect(chunkItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkItems([1, 2, 3, 4, 5], 3)).toEqual([[1, 2, 3], [4, 5]]);
    expect(chunkItems([1, 2, 3, 4, 5], 5)).toEqual([[1, 2, 3, 4, 5]]);
    expect(chunkItems([1, 2, 3, 4, 5], 10)).toEqual([[1, 2, 3, 4, 5]]);
  });

  it("handles empty arrays", () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  it("returns a single chunk if size <= 0", () => {
    expect(chunkItems([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems([1, 2, 3], -1)).toEqual([[1, 2, 3]]);
  });
});
