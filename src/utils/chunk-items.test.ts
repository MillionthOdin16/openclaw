import { describe, test, expect } from "vitest";
import { chunkItems } from "./chunk-items.ts";

describe("chunkItems", () => {
  test("chunks array into specified size", () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    expect(chunkItems(items, 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  test("handles empty array", () => {
    expect(chunkItems([], 3)).toEqual([]);
  });

  test("handles size larger than array", () => {
    const items = [1, 2, 3];
    expect(chunkItems(items, 5)).toEqual([[1, 2, 3]]);
  });

  test("handles size <= 0", () => {
    const items = [1, 2, 3];
    expect(chunkItems(items, 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems(items, -1)).toEqual([[1, 2, 3]]);
  });

  test("handles exact multiples", () => {
    const items = [1, 2, 3, 4, 5, 6];
    expect(chunkItems(items, 2)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });
});
