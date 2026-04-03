## 2026-03-10 - Environment Harvesting Regex Bypass

**Vulnerability:** The static scanner regex for detecting `process.env` harvesting (`/\bfetch\b|\bpost\b|http\.request/i`) failed to catch alternative network egress methods such as `http.get`, `https.request`, `axios`, and `XMLHttpRequest`. This meant malicious plugins could access environment variables and send them out undetected.
**Learning:** Static analysis rules relying on regex matching for common library calls must be exhaustive and account for multiple common networking protocols and third-party tools (like axios) that developers routinely use.
**Prevention:** Always test static analysis regex rules against a comprehensive suite of bypasses and edge cases when analyzing execution contexts, especially for network egress rules.
