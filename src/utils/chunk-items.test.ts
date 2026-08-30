import { describe, expect, test } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  test("chunks array into specified sizes", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7];
    expect(chunkItems(arr, 3)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7],
    ]);
  });

  test("returns single chunk if size is larger than array", () => {
    const arr = [1, 2, 3];
    expect(chunkItems(arr, 5)).toEqual([[1, 2, 3]]);
  });

  test("handles empty arrays", () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  test("returns full array as single chunk if size <= 0", () => {
    const arr = [1, 2, 3];
    expect(chunkItems(arr, 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems(arr, -1)).toEqual([[1, 2, 3]]);
  });
});
