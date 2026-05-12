import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("chunks an array into smaller arrays of the specified size", () => {
    expect(chunkItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkItems(["a", "b", "c", "d"], 3)).toEqual([["a", "b", "c"], ["d"]]);
  });

  it("handles arrays with length equal to the chunk size", () => {
    expect(chunkItems([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
  });

  it("handles arrays with length smaller than the chunk size", () => {
    expect(chunkItems([1, 2], 5)).toEqual([[1, 2]]);
  });

  it("returns an empty array if the input array is empty", () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  it("returns a copy of the full array in a single chunk if size is 0", () => {
    const input = [1, 2, 3];
    const result = chunkItems(input, 0);
    expect(result).toEqual([[1, 2, 3]]);
    expect(result[0]).not.toBe(input); // Should be a copy
  });

  it("returns a copy of the full array in a single chunk if size is negative", () => {
    expect(chunkItems([1, 2, 3], -1)).toEqual([[1, 2, 3]]);
  });
});
