import { describe, expect, it } from "vitest";
import { chunkItems } from "./chunk-items.js";

describe("chunkItems", () => {
  it("should split items into chunks of the specified size", () => {
    const items = [1, 2, 3, 4, 5];
    const chunks = chunkItems(items, 2);
    expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("should return a single chunk if size is larger than items length", () => {
    const items = [1, 2, 3];
    const chunks = chunkItems(items, 5);
    expect(chunks).toEqual([[1, 2, 3]]);
  });

  it("should return an empty array if items is empty", () => {
    const chunks = chunkItems([], 2);
    expect(chunks).toEqual([]);
  });

  it("should return a single chunk if size is 0", () => {
    const items = [1, 2, 3];
    const chunks = chunkItems(items, 0);
    expect(chunks).toEqual([[1, 2, 3]]);
  });

  it("should return a single chunk if size is negative", () => {
    const items = [1, 2, 3];
    const chunks = chunkItems(items, -1);
    expect(chunks).toEqual([[1, 2, 3]]);
  });
});
