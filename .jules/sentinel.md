## 2026-02-16 - Gateway HTTP Headers
**Vulnerability:** Missing standard security headers (X-Content-Type-Options, Referrer-Policy) on API responses.
**Learning:** The gateway uses native `node:http` (not Express/Fastify), so headers must be manually applied.
**Prevention:** Use `setSecurityHeaders` helper in `src/gateway/http-common.ts` for all `ServerResponse` objects.
