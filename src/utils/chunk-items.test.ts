import { describe, it, expect } from 'vitest';
import { chunkItems } from './chunk-items';

describe('chunkItems', () => {
  it('chunks items correctly', () => {
    expect(chunkItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkItems([1, 2, 3, 4, 5], 5)).toEqual([[1, 2, 3, 4, 5]]);
    expect(chunkItems([1, 2, 3, 4, 5], 10)).toEqual([[1, 2, 3, 4, 5]]);
  });

  it('handles empty arrays', () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  it('returns original array wrapper if size <= 0', () => {
    expect(chunkItems([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems([1, 2, 3], -1)).toEqual([[1, 2, 3]]);
  });
});
