## 2026-03-09 - URL Encoding Path Traversal in Control UI

**Vulnerability:** The custom path validator `isSafeRelativePath` failed to handle URL-encoded path segments like `%2e%2e%2f`, which allows bypassing path traversal checks.
**Learning:** Node.js path normalization does not automatically decode URL-encoded segments. Validation needs to apply a single `decodeURIComponent` (wrapped in try/catch) strictly for the validation check to properly catch encoded directory traversal patterns.
**Prevention:** Always normalize and decode user input during path validation before asserting safety. Do not pass the decoded path to file system operations, as valid paths could legitimately contain encoded characters like `%20`.
