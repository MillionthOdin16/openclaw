## 2024-05-18 - Missing ARIA Labels on Icon-Only Chat Action Buttons
**Learning:** Icon-only action buttons (refresh, thinking, focus, cron) in the chat header relied solely on `title` attributes, making them potentially inaccessible to screen readers without hovering.
**Action:** Always add explicit `aria-label` attributes to icon-only buttons, even when a `title` is present, to ensure consistent screen reader support.
