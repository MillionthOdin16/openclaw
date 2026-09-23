import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("chunks a basic array into equal pieces", () => {
    const items = [1, 2, 3, 4, 5, 6];
    const result = chunkItems(items, 2);
    expect(result).toEqual([[1, 2], [3, 4], [5, 6]]);
  });

  it("handles trailing items that don't fill a full chunk", () => {
    const items = [1, 2, 3, 4, 5];
    const result = chunkItems(items, 2);
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("handles a size larger than the array", () => {
    const items = [1, 2, 3];
    const result = chunkItems(items, 5);
    expect(result).toEqual([[1, 2, 3]]);
  });

  it("handles an empty array", () => {
    const items: number[] = [];
    const result = chunkItems(items, 3);
    expect(result).toEqual([]);
  });

  it("returns the original array inside a wrapper array if size is <= 0", () => {
    const items = [1, 2, 3];
    const result = chunkItems(items, 0);
    expect(result).toEqual([[1, 2, 3]]);

    const result2 = chunkItems(items, -1);
    expect(result2).toEqual([[1, 2, 3]]);
  });

  it("does not mutate the original array", () => {
    const items = [1, 2, 3, 4];
    const original = [...items];
    chunkItems(items, 2);
    expect(items).toEqual(original);
  });
});
