## 2026-03-09 - Accessible Icon Buttons in Dashboard
**Learning:** Icon-only buttons relying purely on `title` attributes (or SVG `alt` tags if implemented poorly) provide insufficient accessibility for screen reader users and fail some automated a11y tests, especially in high-interaction components like a dashboard chat navigation panel.
**Action:** Always provide an explicitly translated `aria-label` attribute on icon-only buttons, even when a `title` tooltip attribute is present.
