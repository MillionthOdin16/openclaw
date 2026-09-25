import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("chunks a simple array correctly", () => {
    const result = chunkItems([1, 2, 3, 4, 5], 2);
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("handles size <= 0 by returning the array itself", () => {
    const result = chunkItems([1, 2, 3], 0);
    expect(result).toEqual([[1, 2, 3]]);

    const resultNeg = chunkItems([1, 2, 3], -5);
    expect(resultNeg).toEqual([[1, 2, 3]]);
  });

  it("handles empty arrays", () => {
    const result = chunkItems([], 2);
    expect(result).toEqual([]);
  });

  it("handles size larger than array length", () => {
    const result = chunkItems([1, 2], 5);
    expect(result).toEqual([[1, 2]]);
  });
});
