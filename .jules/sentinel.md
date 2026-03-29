## 2025-02-18 - Unhandled non-JSON errors in fetch
**Vulnerability:** Gateway fetch responses blindly calling `response.json()` without checking `response.ok`.
**Learning:** This Discord Monitor defect pattern allows non-JSON errors (like a 503 HTML response) to bypass standard `try/catch` handlers and throw a `SyntaxError` instead of descriptive network failures. This obscures underlying connection issues (especially with proxies) and can crash the process on transient errors if not guarded correctly.
**Prevention:** Always check `!response.ok` before attempting to parse `response.json()`.
