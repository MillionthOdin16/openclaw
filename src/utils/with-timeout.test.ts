import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { withTimeout } from './with-timeout';

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns original promise if timeout is 0 or less', async () => {
    const p = Promise.resolve('ok');
    expect(await withTimeout(p, 0)).toBe('ok');
    expect(await withTimeout(p, -100)).toBe('ok');
  });

  it('resolves before timeout', async () => {
    const p = new Promise(resolve => setTimeout(() => resolve('ok'), 100));
    const pWithTimeout = withTimeout(p, 200);
    vi.advanceTimersByTime(100);
    expect(await pWithTimeout).toBe('ok');
  });

  it('rejects before timeout', async () => {
    const p = new Promise((_, reject) => setTimeout(() => reject(new Error('fail')), 100));
    const pWithTimeout = withTimeout(p, 200);
    vi.advanceTimersByTime(100);
    await expect(pWithTimeout).rejects.toThrow('fail');
  });

  it('times out and rejects', async () => {
    const p = new Promise(resolve => setTimeout(() => resolve('ok'), 200));
    const pWithTimeout = withTimeout(p, 100);
    vi.advanceTimersByTime(100);
    await expect(pWithTimeout).rejects.toThrow('timeout');
  });
});
