## 2024-05-24 - URL Encoding Path Traversal

**Vulnerability:** Custom path validator `isSafeRelativePath` fails to handle URL-encoded path segments (like `%2e%2e%2f`).
**Learning:** URL-encoded directory traversal markers can bypass simple string normalization and inclusion checks, allowing attackers to read files outside the intended directory.
**Prevention:** Always apply `decodeURIComponent` in a try/catch block to input paths before normalizing and checking for directory traversal markers, while ensuring the decoded path is not passed to the file system API to prevent breaking access to files with `%` in their names.
