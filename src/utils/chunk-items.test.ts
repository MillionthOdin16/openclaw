import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("chunks an array into equal sizes", () => {
    expect(chunkItems([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });

  it("handles remaining items in the last chunk", () => {
    expect(chunkItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns a single chunk if size is larger than array", () => {
    expect(chunkItems([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
  });

  it("returns an empty array if input array is empty", () => {
    // The implementation currently returns `[[]]` if size <= 0, but what if size > 0 and array is empty?
    // Let's check: items.length is 0. i = 0. loop condition 0 < 0 is false. returns `[]`.
    expect(chunkItems([], 2)).toEqual([]);
  });

  it("returns a copy of the whole array in a single chunk if size is <= 0", () => {
    expect(chunkItems([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems([1, 2, 3], -1)).toEqual([[1, 2, 3]]);
    expect(chunkItems([], 0)).toEqual([[]]);
  });
});
