import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("chunks an array into smaller arrays of specified size", () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    const result = chunkItems(items, 3);
    expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  it("returns a single chunk if size is larger than array length", () => {
    const items = [1, 2];
    const result = chunkItems(items, 5);
    expect(result).toEqual([[1, 2]]);
  });

  it("returns a single chunk containing all items if size is 0", () => {
    const items = [1, 2, 3];
    const result = chunkItems(items, 0);
    expect(result).toEqual([[1, 2, 3]]);
  });

  it("returns a single chunk containing all items if size is negative", () => {
    const items = [1, 2, 3];
    const result = chunkItems(items, -5);
    expect(result).toEqual([[1, 2, 3]]);
  });

  it("returns an empty array if input array is empty", () => {
    const result = chunkItems([], 3);
    expect(result).toEqual([]);
  });
});
