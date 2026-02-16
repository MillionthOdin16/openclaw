## 2026-02-16 - Missing Global Security Headers
**Vulnerability:** HTTP responses from the gateway were missing standard security headers (`X-Content-Type-Options`, `X-Frame-Options`). While the Control UI applied them, other endpoints (like tool invocations, webhooks, or 404s) did not.
**Learning:** The codebase relied on individual handlers (like `control-ui.ts`) to set headers, rather than a centralized middleware or wrapper. This "opt-in" security model makes it easy to miss headers on new endpoints.
**Prevention:** Implemented a centralized `applySecurityHeaders` function in `http-common.ts` and called it early in the request processing pipeline in `server-http.ts`. Future endpoints will inherit these headers by default.
