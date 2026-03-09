import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.ts";

describe("chunkItems", () => {
  it("should return the original array inside an array if size <= 0", () => {
    const items = [1, 2, 3];
    expect(chunkItems(items, 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems(items, -1)).toEqual([[1, 2, 3]]);
  });

  it("should chunk the array correctly", () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    expect(chunkItems(items, 2)).toEqual([[1, 2], [3, 4], [5, 6], [7]]);
    expect(chunkItems(items, 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    expect(chunkItems(items, 7)).toEqual([[1, 2, 3, 4, 5, 6, 7]]);
    expect(chunkItems(items, 10)).toEqual([[1, 2, 3, 4, 5, 6, 7]]);
  });

  it("should return an empty array if passed an empty array", () => {
    expect(chunkItems([], 2)).toEqual([]);
    // Even when size <= 0, empty array -> [[]] according to Array.from([]) -> [] and the size<=0 block.
    // Actually, Array.from([]) -> []. returning [[...]] => [[]]
    expect(chunkItems([], 0)).toEqual([[]]);
  });
});
