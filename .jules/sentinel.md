## 2024-05-22 - [Centralized Security Headers]
**Vulnerability:** Inconsistent application of security headers across different endpoints (UI vs API).
**Learning:** Security headers like CSP and X-Frame-Options were applied only in `control-ui.ts` but not globally in `server-http.ts`.
**Prevention:** Centralized header setting logic in `src/gateway/http-common.ts` via `setSecurityHeaders` and applied it globally in `server-http.ts`'s `handleRequest`.
