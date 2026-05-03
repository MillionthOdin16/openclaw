import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("should chunk items properly", () => {
    const items = [1, 2, 3, 4, 5];
    expect(chunkItems(items, 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("should handle size <= 0", () => {
    const items = [1, 2, 3];
    expect(chunkItems(items, 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems(items, -1)).toEqual([[1, 2, 3]]);
  });

  it("should handle empty arrays", () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  it("should handle size larger than array length", () => {
    const items = [1, 2];
    expect(chunkItems(items, 5)).toEqual([[1, 2]]);
  });
});
