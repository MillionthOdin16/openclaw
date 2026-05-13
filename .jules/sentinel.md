## 2024-05-18 - URL Encoding Path Traversal in Control UI

**Vulnerability:** Path traversal check in `isSafeRelativePath` for the Control UI static assets could be bypassed by sending URL-encoded inputs (e.g. `%2e%2e%2f` instead of `../`) because `path.normalize` doesn't decode URL components before testing them.

**Learning:** When validating incoming URL paths for safety (specifically directory traversal markers), URL decoding must be performed manually before normalization. Path normalization functions like `path.posix.normalize` treat `%2e` as literal string segments.

**Prevention:** Always safely apply `decodeURIComponent` in a `try/catch` block prior to checking inputs against traversal markers like `../` or `..`.
