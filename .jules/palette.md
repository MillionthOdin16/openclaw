## 2025-02-12 - Missing ARIA Labels on Icon-Only Buttons

**Learning:** Found several icon-only buttons throughout the UI (`session-close-btn` in `usage-render-details.ts`, `filter-chip-remove` and `session-copy-btn` in `usage-render-overview.ts`, and the close button in `markdown-sidebar.ts`) that have `title` attributes but lack `aria-label` attributes. Screen readers rely on `aria-label` when there's no visible text inside the button. The `title` attribute isn't reliably read by all screen readers.
**Action:** Add `aria-label` matching the `title` attribute to icon-only buttons to ensure they are fully accessible to screen reader users.
