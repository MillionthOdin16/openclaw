import { describe, it, expect, vi } from 'vitest';
import { bindAbortRelay, fetchWithTimeout } from './fetch-timeout';

describe('fetch-timeout', () => {
  describe('bindAbortRelay', () => {
    it('returns a bound abort function', () => {
      const controller = new AbortController();
      const spy = vi.spyOn(controller, 'abort');
      const abortFn = bindAbortRelay(controller);

      expect(typeof abortFn).toBe('function');
      abortFn();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('fetchWithTimeout', () => {
    it('resolves if fetch succeeds before timeout', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
      const response = await fetchWithTimeout('https://example.com', {}, 100, mockFetch as any);
      expect(response).toBeInstanceOf(Response);
      expect(mockFetch).toHaveBeenCalled();

      // Check that the abort controller was passed
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe('https://example.com');
      expect(callArgs[1].signal).toBeInstanceOf(AbortSignal);
    });

    it('aborts and throws if fetch takes longer than timeout', async () => {
      const mockFetch = vi.fn().mockImplementation((url, init) => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => resolve(new Response('ok')), 100);
          init.signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('AbortError'));
          });
        });
      });

      await expect(fetchWithTimeout('https://example.com', {}, 10, mockFetch as any)).rejects.toThrow('AbortError');
    });
  });
});
