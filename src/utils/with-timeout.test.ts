import { describe, it, expect, vi } from 'vitest';
import { withTimeout } from './with-timeout';

describe('withTimeout', () => {
  it('returns successful promise result if it resolves before timeout', async () => {
    const p = new Promise(resolve => setTimeout(() => resolve('success'), 10));
    await expect(withTimeout(p, 50)).resolves.toBe('success');
  });

  it('rejects with timeout error if promise takes too long', async () => {
    const p = new Promise(resolve => setTimeout(() => resolve('success'), 50));
    await expect(withTimeout(p, 10)).rejects.toThrow('timeout');
  });

  it('returns original promise if timeoutMs is 0', async () => {
    const p = new Promise(resolve => setTimeout(() => resolve('success'), 10));
    const resultPromise = withTimeout(p, 0);
    expect(resultPromise).toBe(p);
    await expect(resultPromise).resolves.toBe('success');
  });

  it('returns original promise if timeoutMs is undefined', async () => {
    const p = new Promise(resolve => setTimeout(() => resolve('success'), 10));
    const resultPromise = withTimeout(p, undefined as any);
    expect(resultPromise).toBe(p);
    await expect(resultPromise).resolves.toBe('success');
  });
});
