## 2026-06-05 - Icon-only buttons missing aria-labels

**Learning:** Found several icon-only buttons in the chat header (refresh, thinking toggle, focus toggle, hide cron) that were relying only on the `title` attribute for accessibility. Screen readers rely on `aria-label` or visually hidden text for icon-only buttons, as `title` attributes are often inconsistently read or ignored by some assistive tech.
**Action:** Always add explicit `aria-label` attributes to icon-only buttons alongside the `title` attribute to ensure proper screen reader support.
