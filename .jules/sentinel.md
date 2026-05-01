## 2026-05-01 - URL Encoding Path Traversal

**Vulnerability:** The `isSafeRelativePath` function in `src/gateway/control-ui.ts` fails to validate URL-encoded path traversal characters (like `%2e%2e%2f`), allowing directory traversal attacks.
**Learning:** Node.js path module does not decode URL-encoded paths natively when normalizing or resolving paths, which allows encoded traversal sequences to bypass strict string validation checks while being decoded later or at lower levels in some configurations.
**Prevention:** Always safely apply `decodeURIComponent` wrapped in a `try/catch` block before applying custom path traversal validators and before calling `path.normalize()`.
