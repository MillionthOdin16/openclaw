## 2026-02-14 - Missing Security Headers
**Vulnerability:** Missing security headers (HSTS, X-Content-Type-Options, etc.) on API responses.
**Learning:** The gateway uses raw `node:http` server instead of a framework like Express/Fastify (which often have middleware like Helmet). This means security headers must be manually applied to the `ServerResponse` object.
**Prevention:** Use `setSecurityHeaders` helper from `src/gateway/http-common.ts` for all new HTTP handlers.
