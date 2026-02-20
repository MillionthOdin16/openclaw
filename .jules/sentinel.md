## 2024-05-23 - Response Helper Duplication
**Vulnerability:** Inconsistent application of security headers due to duplicated response helper functions (`sendJson`) across `src/gateway/server-http.ts` and `src/gateway/http-common.ts`.
**Learning:** Duplicated utility functions create blind spots where global security policies (like headers) are not applied consistently, as seen with `server-http.ts` defining its own `sendJson` and bypassing `http-common.ts`.
**Prevention:** Centralize all HTTP response logic in `src/gateway/http-common.ts` and strictly enforce its usage across the gateway to ensure consistent security posture.
