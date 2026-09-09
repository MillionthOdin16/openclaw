## 2024-09-09 - Missing ARIA Labels on Icon-Only Buttons

**Learning:** Found that the top navigation icon buttons (refresh, thinking, focus, cron visibility) in `app-render.helpers.ts` lack `aria-label` attributes, relying only on `title` attributes for tooltips, which can be inconsistent for screen readers.
**Action:** Add explicit `aria-label`s to all `btn--icon` elements matching their visual tooltips to ensure they are accessible via keyboard and screen readers consistently across the app.
