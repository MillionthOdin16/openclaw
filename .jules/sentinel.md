## 2026-05-12 - URL Encoding Path Traversal

**Vulnerability:** The custom path validator `isSafeRelativePath` in `src/gateway/control-ui.ts` failed to decode URL-encoded path segments (like `%2e%2e%2f`) before validating them against directory traversal markers (like `../`).
**Learning:** Path validation logic operates on exact string matches. Node.js treats `%2e` literally, meaning `%2e%2e%2f` bypasses simple string checks for `../` but can later be evaluated as a traversal by subsequent URL-decoding layers or file system operations if not explicitly mitigated.
**Prevention:** Always safely apply a single `decodeURIComponent` wrapped in a `try/catch` block (ignoring `URIError` for malformed URIs) before normalizing paths and checking for directory traversal markers.
