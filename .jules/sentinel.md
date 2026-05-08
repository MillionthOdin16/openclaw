## 2024-05-24 - URL Encoding Path Traversal

**Vulnerability:** URL-encoded path traversal characters (`%2e%2e%2f`) in the UI control panel bypassed path validation logic in `isSafeRelativePath`.
**Learning:** Node.js path validation doesn't automatically decode URLs, so simple string matching for `../` fails against URL-encoded paths. Decoding must happen exactly once before validation.
**Prevention:** Always `decodeURIComponent` inside a `try/catch` (ignoring URIError) before performing any string-based path traversal checks. Never use iterative decoding or pass the decoded path to Node.js `path` resolution, as it treats `%2e` literally.
