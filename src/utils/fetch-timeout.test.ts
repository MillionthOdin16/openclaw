import { describe, expect, it, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { bindAbortRelay, fetchWithTimeout } from './fetch-timeout.js';

describe('fetch-timeout', () => {
  let clearTimeoutSpy: MockInstance;

  beforeEach(() => {
    clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('bindAbortRelay', () => {
    it('relays abort correctly without forwarding arguments', () => {
      const controller = new AbortController();
      const abortSpy = vi.spyOn(controller, 'abort');

      const relay = bindAbortRelay(controller);

      // Simulate an event being passed, like from addEventListener
      relay();

      expect(abortSpy).toHaveBeenCalledTimes(1);
      // It should be called without arguments (or undefined), not the simulated event
      expect(abortSpy).toHaveBeenCalledWith();
    });
  });

  describe('fetchWithTimeout', () => {
    it('calls fetch with the provided url and init', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response());
      const init = { method: 'POST', body: 'test' };

      await fetchWithTimeout('https://example.com', init, 1000, mockFetch);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com', expect.objectContaining({
        method: 'POST',
        body: 'test',
        signal: expect.any(AbortSignal),
      }));
    });

    it('clears timeout upon successful fetch', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response());

      await fetchWithTimeout('https://example.com', {}, 1000, mockFetch);

      expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    });

    it('clears timeout upon failed fetch', async () => {
      const mockError = new Error('network error');
      const mockFetch = vi.fn().mockRejectedValue(mockError);

      await expect(fetchWithTimeout('https://example.com', {}, 1000, mockFetch)).rejects.toThrow('network error');

      expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    });

    it('aborts the request after timeout', async () => {
      // Use fake timers to fast-forward time
      vi.useFakeTimers();

      let signal: AbortSignal;
      const mockFetch = vi.fn().mockImplementation((url, init) => {
        signal = init.signal;
        return new Promise(() => {}); // Never resolves
      });

      // Start the fetch but don't await it yet because it will hang
      const _fetchPromise = fetchWithTimeout('https://example.com', {}, 1000, mockFetch);

      // Fast-forward past the timeout
      vi.advanceTimersByTime(1001);

      // The signal should now be aborted
      expect(signal!.aborted).toBe(true);

      // Clean up fake timers
      vi.useRealTimers();
    });
  });
});
