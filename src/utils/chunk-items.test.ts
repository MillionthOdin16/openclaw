import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("chunks a basic array into subarrays of the specified size", () => {
    const items = [1, 2, 3, 4, 5];
    const result = chunkItems(items, 2);
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("handles an empty array", () => {
    const items: number[] = [];
    const result = chunkItems(items, 3);
    expect(result).toEqual([]);
  });

  it("returns a single array if size is 0", () => {
    const items = [1, 2, 3];
    const result = chunkItems(items, 0);
    expect(result).toEqual([[1, 2, 3]]);
    // Ensure the array was copied, not just returning the same reference
    expect(result[0]).not.toBe(items);
  });

  it("returns a single array if size is negative", () => {
    const items = [1, 2, 3];
    const result = chunkItems(items, -1);
    expect(result).toEqual([[1, 2, 3]]);
    expect(result[0]).not.toBe(items);
  });

  it("chunks evenly when array length is exactly divisible by size", () => {
    const items = [1, 2, 3, 4, 5, 6];
    const result = chunkItems(items, 3);
    expect(result).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it("chunks correctly when array length is less than size", () => {
    const items = [1, 2];
    const result = chunkItems(items, 5);
    expect(result).toEqual([[1, 2]]);
  });
});
