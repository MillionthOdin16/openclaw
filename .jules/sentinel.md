## 2026-03-09 - URL Encoding Path Traversal
**Vulnerability:** A URL encoding path traversal vulnerability in `isSafeRelativePath` in `src/gateway/control-ui.ts` allows attackers to bypass standard directory traversal checks (`../`) by using URL-encoded sequences (e.g., `%2e%2e%2f`).
**Learning:** URL decoding must be performed repeatedly before performing path safety checks since paths can be heavily or double URL-encoded.
**Prevention:** Iteratively `decodeURIComponent` on user-provided path inputs until the output is fully decoded and stable before performing directory traversal checks and normalizing the path.
