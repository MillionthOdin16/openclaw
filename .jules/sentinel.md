## 2025-02-24 - Unescaped tool arguments in HTML Export
**Vulnerability:** XSS vulnerability in HTML export when rendering read tool arguments.
**Learning:** Tool arguments displayed in HTML template weren't fully escaped.
**Prevention:** Always escape tool argument properties that are rendered to the DOM.
