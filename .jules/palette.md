## 2024-05-14 - Icon-only buttons lacking ARIA labels
**Learning:** Several icon-only buttons (like close or remove buttons using `×` or an SVG) in the UI only had a `title` attribute, which is not sufficient for screen reader accessibility.
**Action:** Added `aria-label` attributes to these buttons (e.g., in `usage-render-overview.ts`, `usage-render-details.ts`, and `markdown-sidebar.ts`) to ensure their function is properly announced by screen readers.
