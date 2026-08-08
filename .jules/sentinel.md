## 2026-02-24 - Fix XSS vulnerability in markdown links

**Vulnerability:** XSS via `javascript:` scheme in Markdown links, rendered unprotected by Marked.js
**Learning:** `marked.use({ renderer: { link(...) } })` allows overriding specific markdown token rendering and stripping links globally. Additionally, to let marked fallback to text appropriately while dropping the unsafe anchor tag, the correct pattern is returning `this.parser.parseInline(token.tokens || [])` to render the content rather than a literal string.
**Prevention:** Override renderer safely or sanitize all user-supplied Markdown content through standard DOMPurify passes.
