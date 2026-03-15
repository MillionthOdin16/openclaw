import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("chunks array perfectly into equal pieces", () => {
    const arr = [1, 2, 3, 4, 5, 6];
    expect(chunkItems(arr, 2)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });

  it("handles remainder properly", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(chunkItems(arr, 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns single chunk when size is larger than array length", () => {
    const arr = [1, 2, 3];
    expect(chunkItems(arr, 5)).toEqual([[1, 2, 3]]);
  });

  it("handles empty arrays", () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  it("returns full array as one chunk for size = 0", () => {
    const arr = [1, 2, 3];
    expect(chunkItems(arr, 0)).toEqual([[1, 2, 3]]);
  });

  it("returns full array as one chunk for negative size", () => {
    const arr = [1, 2, 3];
    expect(chunkItems(arr, -1)).toEqual([[1, 2, 3]]);
  });

  it("creates a new array instead of modifying original for invalid sizes", () => {
    const arr = [1, 2, 3];
    const result = chunkItems(arr, 0);
    expect(result[0]).not.toBe(arr);
    expect(result[0]).toEqual(arr);
  });
});
