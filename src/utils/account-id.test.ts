import { describe, expect, it, vi } from 'vitest';
import { normalizeAccountId } from './account-id.js';
import * as routingModule from '../routing/account-id.js';

describe('normalizeAccountId', () => {
  it('should call normalizeOptionalAccountId with the provided value', () => {
    const spy = vi.spyOn(routingModule, 'normalizeOptionalAccountId').mockReturnValue('normalized');
    const result = normalizeAccountId('test');
    expect(spy).toHaveBeenCalledWith('test');
    expect(result).toBe('normalized');
    spy.mockRestore();
  });
});
