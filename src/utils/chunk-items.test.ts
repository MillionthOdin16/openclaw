import { describe, expect, it } from 'vitest';
import { chunkItems } from './chunk-items.js';

describe('chunkItems', () => {
  it('chunks array into smaller arrays of given size', () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    expect(chunkItems(items, 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  it('handles exact multiples of chunk size', () => {
    const items = [1, 2, 3, 4, 5, 6];
    expect(chunkItems(items, 3)).toEqual([[1, 2, 3], [4, 5, 6]]);
  });

  it('returns single array when size is larger than array length', () => {
    const items = [1, 2, 3];
    expect(chunkItems(items, 5)).toEqual([[1, 2, 3]]);
  });

  it('returns empty array when input is empty', () => {
    expect(chunkItems([], 3)).toEqual([]);
  });

  it('returns array containing copy of input when size is 0', () => {
    const items = [1, 2, 3];
    const result = chunkItems(items, 0);
    expect(result).toEqual([[1, 2, 3]]);
    expect(result[0]).not.toBe(items); // Ensures it's a copy
  });

  it('returns array containing copy of input when size is negative', () => {
    const items = [1, 2, 3];
    const result = chunkItems(items, -1);
    expect(result).toEqual([[1, 2, 3]]);
    expect(result[0]).not.toBe(items); // Ensures it's a copy
  });
});
