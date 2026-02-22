import { describe, it, expect, vi } from 'vitest';
import { ServerResponse } from 'node:http';
import { setDefaultSecurityHeaders } from './http-common.js';

describe('setDefaultSecurityHeaders', () => {
  it('should set security headers', () => {
    const res = {
      setHeader: vi.fn(),
    } as unknown as ServerResponse;

    setDefaultSecurityHeaders(res);

    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'no-referrer');
    expect(res.setHeader).toHaveBeenCalledWith('X-Permitted-Cross-Domain-Policies', 'none');
    expect(res.setHeader).toHaveBeenCalledWith('Cross-Origin-Resource-Policy', 'same-origin');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      'geolocation=(), camera=(), microphone=(), payment=()'
    );
  });
});
