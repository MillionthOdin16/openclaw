import { describe, expect, it } from 'vitest';
import { withTimeout } from './with-timeout.js';

describe('withTimeout', () => {
  it('should resolve if promise resolves before timeout', async () => {
    const promise = new Promise<number>((resolve) => setTimeout(() => resolve(42), 10));
    const result = await withTimeout(promise, 50);
    expect(result).toBe(42);
  });

  it('should reject if promise rejects before timeout', async () => {
    const promise = new Promise<number>((_, reject) => setTimeout(() => reject(new Error('fail')), 10));
    await expect(withTimeout(promise, 50)).rejects.toThrow('fail');
  });

  it('should reject with "timeout" if promise takes too long', async () => {
    const promise = new Promise<number>((resolve) => setTimeout(() => resolve(42), 50));
    await expect(withTimeout(promise, 10)).rejects.toThrow('timeout');
  });

  it('should not apply timeout if timeoutMs is 0', async () => {
    const promise = new Promise<number>((resolve) => setTimeout(() => resolve(42), 20));
    const result = await withTimeout(promise, 0);
    expect(result).toBe(42);
  });

  it('should not apply timeout if timeoutMs is negative', async () => {
    const promise = new Promise<number>((resolve) => setTimeout(() => resolve(42), 20));
    const result = await withTimeout(promise, -10);
    expect(result).toBe(42);
  });
});
