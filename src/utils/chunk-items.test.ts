import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("chunks items when size is greater than 0", () => {
    const items = [1, 2, 3, 4, 5];
    expect(chunkItems(items, 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkItems(items, 3)).toEqual([[1, 2, 3], [4, 5]]);
    expect(chunkItems(items, 5)).toEqual([[1, 2, 3, 4, 5]]);
    expect(chunkItems(items, 10)).toEqual([[1, 2, 3, 4, 5]]);
  });

  it("returns a single array containing all items when size is <= 0", () => {
    const items = [1, 2, 3];
    expect(chunkItems(items, 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems(items, -1)).toEqual([[1, 2, 3]]);
  });

  it("returns a new array and does not mutate the original items when size <= 0", () => {
    const items = [1, 2, 3];
    const result = chunkItems(items, 0);
    expect(result[0]).not.toBe(items);
    expect(result[0]).toEqual(items);

    // Original shouldn't change if we modify the returned array elements
    result[0][0] = 99;
    expect(items[0]).toBe(1);
  });

  it("handles empty arrays", () => {
    expect(chunkItems([], 2)).toEqual([]);
    expect(chunkItems([], 0)).toEqual([[]]);
  });
});
