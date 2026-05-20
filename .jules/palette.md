## 2026-05-20 - [Icon-Only Chat Buttons Missing ARIA Labels]

**Learning:** The chat control icon buttons used `title` for visual tooltips but omitted `aria-label`, making them inaccessible to screen readers.
**Action:** Ensure all icon-only buttons (`btn--icon`) using tooltips always have a corresponding `aria-label` reflecting the action.
