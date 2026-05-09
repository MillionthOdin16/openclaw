## 2024-05-10 - URL Encoding Path Traversal

**Vulnerability:** Custom path validators like `isSafeRelativePath` fail to handle URL-encoded path segments (e.g., `%2e%2e%2f` for `../`), allowing directory traversal attacks.
**Learning:** Node.js treats `%2e` literally, so if validation occurs before decoding, malicious paths bypass the checks. Decoding the path prior to file resolution using standard functions is incorrect as it breaks access to legitimate files with `%` in their names.
**Prevention:** Apply a single `decodeURIComponent` wrapped in a `try/catch` block (ignoring `URIError`) strictly for validation purposes, before checking for directory traversal markers and normalization.
