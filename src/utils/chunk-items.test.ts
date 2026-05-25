import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("chunks array into specified size", () => {
    const items = [1, 2, 3, 4, 5];
    const result = chunkItems(items, 2);
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("handles exact multiples of chunk size", () => {
    const items = [1, 2, 3, 4, 5, 6];
    const result = chunkItems(items, 3);
    expect(result).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it("handles size larger than array length", () => {
    const items = [1, 2, 3];
    const result = chunkItems(items, 5);
    expect(result).toEqual([[1, 2, 3]]);
  });

  it("handles empty array", () => {
    const items: number[] = [];
    const result = chunkItems(items, 2);
    expect(result).toEqual([]);
  });

  it("handles size <= 0", () => {
    const items = [1, 2, 3];
    const result1 = chunkItems(items, 0);
    expect(result1).toEqual([[1, 2, 3]]);

    const result2 = chunkItems(items, -1);
    expect(result2).toEqual([[1, 2, 3]]);
  });
});
