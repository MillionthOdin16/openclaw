import { describe, expect, it, vi } from 'vitest';
import { bindAbortRelay, fetchWithTimeout } from './fetch-timeout.js';

describe('bindAbortRelay', () => {
  it('should abort the controller without passing the event argument', () => {
    const controller = new AbortController();
    const abortSpy = vi.spyOn(controller, 'abort');
    const relay = bindAbortRelay(controller);

    // Call it as an event listener, passing an event object
    relay(new Event('abort') as any);

    // It should be called without the event argument
    expect(abortSpy).toHaveBeenCalledWith();
  });
});

describe('fetchWithTimeout', () => {
  it('should resolve if fetch completes before timeout', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
    const response = await fetchWithTimeout('http://example.com', {}, 50, mockFetch);
    expect(response).toBeDefined();
    expect(mockFetch).toHaveBeenCalledWith('http://example.com', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('should abort if fetch takes longer than timeout', async () => {
    const mockFetch = vi.fn().mockImplementation((_url, init) => {
      return new Promise((_, reject) => {
        init.signal.addEventListener('abort', () => reject(new Error('AbortError')));
      });
    });

    await expect(fetchWithTimeout('http://example.com', {}, 10, mockFetch)).rejects.toThrow('AbortError');
  });

  it('should use a minimum timeout of 1ms', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
    await fetchWithTimeout('http://example.com', {}, -100, mockFetch);
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should clear the timeout if fetch fails quickly', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    await expect(fetchWithTimeout('http://example.com', {}, 100, mockFetch)).rejects.toThrow('Network error');
  });
});
