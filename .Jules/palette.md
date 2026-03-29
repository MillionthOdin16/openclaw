## 2026-03-29 - Add ARIA labels to icon-only buttons

**Learning:** Icon-only buttons with `title` attributes need `aria-label` attributes to be fully accessible to screen readers, especially when the icon content itself doesn't have text.
**Action:** Add `aria-label` matching the `title` value to all icon-only action buttons (like chat controls).
