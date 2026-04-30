## 2023-10-27 - URL Encoding Path Traversal in Control UI
**Vulnerability:** URL Encoding Path Traversal where custom path validators in `src/gateway/control-ui.ts` fail to handle encoded path segments like `%2e%2e%2f`.
**Learning:** The `isSafeRelativePath` validator was operating on raw paths before decoding, which could potentially bypass checks if paths were not decoded before validation.
**Prevention:** Apply `decodeURIComponent` (handling `URIError` safely) to paths before validating them against directory traversal markers.
