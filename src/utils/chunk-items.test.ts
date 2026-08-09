import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("chunks a simple array correctly", () => {
    expect(chunkItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("handles empty array", () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  it("handles size <= 0", () => {
    expect(chunkItems([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems([1, 2, 3], -1)).toEqual([[1, 2, 3]]);
  });

  it("handles exact multiples of chunk size", () => {
    expect(chunkItems([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });

  it("handles size larger than array length", () => {
    expect(chunkItems([1, 2], 5)).toEqual([[1, 2]]);
  });
});
