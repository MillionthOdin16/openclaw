## 2024-05-18 - URL Encoding Path Traversal in Control UI
**Vulnerability:** The `isSafeRelativePath` function failed to handle URL-encoded path segments like `%2e%2e%2f` when checking for directory traversal, allowing encoded payloads to bypass the security check.
**Learning:** Path validators must normalize encoding before checking for traversal sequences, as Node.js `path` modules treat encoded characters literally rather than decoding them.
**Prevention:** Apply a single `decodeURIComponent` wrapped in a `try/catch` block before checking for traversal markers and calling `path.normalize()`. Avoid passing the decoded path to file system operations or `path.resolve` to ensure valid filenames containing `%` still work.
