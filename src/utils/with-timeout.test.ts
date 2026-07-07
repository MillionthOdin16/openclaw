import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { withTimeout } from './with-timeout.js';

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the original promise if timeout is 0', async () => {
    const promise = Promise.resolve('test');
    const result = await withTimeout(promise, 0);
    expect(result).toBe('test');
  });

  it('returns the original promise if timeout is negative', async () => {
    const promise = Promise.resolve('test');
    const result = await withTimeout(promise, -100);
    expect(result).toBe('test');
  });

  it('resolves with the promise value if promise resolves before timeout', async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve('test'), 100));
    const resultPromise = withTimeout(promise, 200);

    vi.advanceTimersByTime(150); // fast-forward past promise resolution, but before timeout

    const result = await resultPromise;
    expect(result).toBe('test');
  });

  it('rejects with the promise error if promise rejects before timeout', async () => {
    const promise = new Promise((_, reject) => setTimeout(() => reject(new Error('test error')), 100));
    const resultPromise = withTimeout(promise, 200);

    vi.advanceTimersByTime(150); // fast-forward past promise rejection

    await expect(resultPromise).rejects.toThrow('test error');
  });

  it('rejects with a timeout error if promise takes longer than timeout', async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve('test'), 200));
    const resultPromise = withTimeout(promise, 100);

    vi.advanceTimersByTime(150); // fast-forward past timeout, but before promise resolution

    await expect(resultPromise).rejects.toThrow('timeout');
  });

  it('clears the timeout timer upon promise resolution', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const promise = Promise.resolve('test');
    await withTimeout(promise, 100);

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
  });
});
