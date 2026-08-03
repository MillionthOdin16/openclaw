import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithTimeout, bindAbortRelay } from './fetch-timeout';

describe('fetch-timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('bindAbortRelay', () => {
    it('calls abort on the controller', () => {
      const controller = new AbortController();
      const abortSpy = vi.spyOn(controller, 'abort');
      const relay = bindAbortRelay(controller);
      relay();
      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe('fetchWithTimeout', () => {
    it('resolves if fetch finishes before timeout', async () => {
      const mockFetch = vi.fn().mockImplementation(async (_url, _init) => {
        return new Response('ok');
      });

      const fetchPromise = fetchWithTimeout('http://example.com', {}, 200, mockFetch as unknown as typeof fetch);
      const res = await fetchPromise;
      expect(await res.text()).toBe('ok');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('aborts the signal when timeout occurs', async () => {
      const mockFetch = vi.fn().mockImplementation((_url, init) => {
        return new Promise((resolve, reject) => {
          init.signal.addEventListener('abort', () => {
            reject(new Error('AbortError'));
          });
        });
      });

      const fetchPromise = fetchWithTimeout('http://example.com', {}, 100, mockFetch as unknown as typeof fetch);
      vi.advanceTimersByTime(150);
      await expect(fetchPromise).rejects.toThrow('AbortError');
    });
  });
});
