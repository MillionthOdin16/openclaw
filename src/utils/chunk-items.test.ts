import { describe, it, expect } from "vitest";
import { chunkItems } from "./chunk-items";

describe("chunkItems", () => {
  it("should chunk items into rows of the specified size", () => {
    const items = [1, 2, 3, 4, 5];
    expect(chunkItems(items, 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkItems(items, 3)).toEqual([[1, 2, 3], [4, 5]]);
  });

  it("should return a single row if size is greater than or equal to items length", () => {
    const items = [1, 2, 3];
    expect(chunkItems(items, 3)).toEqual([[1, 2, 3]]);
    expect(chunkItems(items, 5)).toEqual([[1, 2, 3]]);
  });

  it("should return an empty array if items array is empty", () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  it("should return a single row with a copy of items if size is 0 or less", () => {
    const items = [1, 2, 3];
    expect(chunkItems(items, 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems(items, -1)).toEqual([[1, 2, 3]]);
  });

  it("should not mutate the original array", () => {
    const items = [1, 2, 3];
    chunkItems(items, 2);
    expect(items).toEqual([1, 2, 3]);
  });
});
