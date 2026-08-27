## 2026-03-09 - Add ARIA labels to icon-only buttons
**Learning:** Found several icon-only '×' close buttons missing `aria-label` across different components (usage overview, usage query chips, session details, and markdown sidebar). While they had `title` attributes which provide some tooltip context, screen readers rely heavily on `aria-label` for proper context on icon-only interactive elements.
**Action:** Always ensure `aria-label` is present on buttons where the visual content is purely symbolic (like '×' or icons), even if a `title` attribute is present.
