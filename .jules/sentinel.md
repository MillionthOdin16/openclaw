## 2025-03-08 - Fix XSS vulnerability via unsafe markdown links
**Vulnerability:** XSS via unsafe markdown link protocols (e.g., `javascript:`, `data:`, `vbscript:`). The HTML exporter rendered these protocols literally, which allowed script execution when clicked.
**Learning:** The default behavior of `marked.js` does not sanitize unsafe protocols unless explicitly configured or overridden.
**Prevention:** Always implement a custom renderer or enable built-in sanitization options when parsing markdown into HTML to strip unsafe link protocols.
