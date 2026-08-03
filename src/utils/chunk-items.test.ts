import { describe, expect, it } from 'vitest';
import { chunkItems } from './chunk-items';

describe('chunkItems', () => {
  it('returns original array wrapped if size is 0 or negative', () => {
    expect(chunkItems([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
    expect(chunkItems([1, 2, 3], -1)).toEqual([[1, 2, 3]]);
  });

  it('chunks array evenly', () => {
    expect(chunkItems([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });

  it('chunks array with remainder', () => {
    expect(chunkItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('handles empty arrays', () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  it('handles array smaller than size', () => {
    expect(chunkItems([1, 2], 5)).toEqual([[1, 2]]);
  });
});
