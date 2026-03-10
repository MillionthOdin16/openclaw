import { describe, it, expect } from "vitest";
import { chunkItems } from "./chunk-items";

describe("chunkItems", () => {
  it("should divide exactly", () => {
    const arr = [1, 2, 3, 4];
    expect(chunkItems(arr, 2)).toEqual([[1, 2], [3, 4]]);
  });

  it("should divide with remainder", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(chunkItems(arr, 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("should handle size <= 0", () => {
    const arr = [1, 2, 3];
    expect(chunkItems(arr, 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems(arr, -1)).toEqual([[1, 2, 3]]);
  });

  it("should handle empty arrays", () => {
    expect(chunkItems([], 2)).toEqual([]);
    expect(chunkItems([], 0)).toEqual([[]]);
  });
});
