import { describe, expect, it } from 'vitest';
import { chunkItems } from './chunk-items.js';

describe('chunkItems', () => {
  it('should split an array into chunks of the given size', () => {
    const items = [1, 2, 3, 4, 5];
    const result = chunkItems(items, 2);
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('should handle size equal to array length', () => {
    const items = [1, 2, 3];
    const result = chunkItems(items, 3);
    expect(result).toEqual([[1, 2, 3]]);
  });

  it('should handle size greater than array length', () => {
    const items = [1, 2, 3];
    const result = chunkItems(items, 5);
    expect(result).toEqual([[1, 2, 3]]);
  });

  it('should handle an empty array', () => {
    const items: number[] = [];
    const result = chunkItems(items, 2);
    expect(result).toEqual([]);
  });

  it('should return a copy of the array inside an array if size is 0', () => {
    const items = [1, 2, 3];
    const result = chunkItems(items, 0);
    expect(result).toEqual([[1, 2, 3]]);
    // Ensure it's a copy
    expect(result[0]).not.toBe(items);
  });

  it('should return a copy of the array inside an array if size is negative', () => {
    const items = [1, 2, 3];
    const result = chunkItems(items, -1);
    expect(result).toEqual([[1, 2, 3]]);
    // Ensure it's a copy
    expect(result[0]).not.toBe(items);
  });
});
