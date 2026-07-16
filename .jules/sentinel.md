## 2026-03-08 - XSS in HTML Exports via Markdown Links
**Vulnerability:** Markdown parsing in HTML exports allowed javascript:, vbscript:, and data: schemes in anchor links. This allowed arbitrary javascript execution when clicking links in exported HTML files.
**Learning:** The marked.js renderer configuration lacked a custom 'link' renderer to strip dangerous schemes. While raw HTML and images were sanitized, links were bypassed.
**Prevention:** Always implement custom renderers or use DOMPurify when using marked.js to render user-controlled markdown.
