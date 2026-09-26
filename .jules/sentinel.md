## 2026-03-09 - Node Protocol Prefix Bypass in Security Scanner
**Vulnerability:** The internal `skill-scanner.ts` failed to detect dangerous command execution (e.g., `exec`, `spawn`) when the `child_process` module was imported using the `node:` protocol prefix (i.e., `node:child_process`).
**Learning:** Security regexes checking for imports or module usage must account for modern Node.js module resolution features, such as the `node:` protocol prefix, which can be used to bypass simplistic string or regex matching.
**Prevention:** Ensure static analysis and security scanning rules that target Node built-in modules use regex patterns that optionally match the `node:` prefix, such as `/(?:node:)?<module_name>/`.
