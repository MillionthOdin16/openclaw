## 2025-03-08 - Fix Regex False Positive in Skill Scanner
**Vulnerability:** The skill scanner falsely flagged safe RegExp `.exec()` method calls when `child_process` was present anywhere in the file.
**Learning:** Naive regex searches for `\bexec\s*\(` cause false positives for common method names. Combining them with unrelated whole-file context rules (like `/child_process/`) exacerbates the issue.
**Prevention:** Use negative lookbehinds like `(?<!\.\s*)` for standalone function calls or specifically target known objects like `cp.exec(` to distinguish them from standard library methods.
