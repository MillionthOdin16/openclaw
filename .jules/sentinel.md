## 2026-03-09 - Fix XSS vulnerability in markdown links
**Vulnerability:** Markdown links with `javascript:`, `vbscript:`, or `data:` protocols were parsed directly in the `export-html` template.
**Learning:** `marked.js` by default allows dangerous link protocols. While other HTML generation parts were escaping content appropriately, the link renderer needed an explicit override to prevent XSS via `[text](javascript:alert(1))`.
**Prevention:** Always validate or sanitize link `href` protocols in custom markdown renderers to prevent XSS vectors.
