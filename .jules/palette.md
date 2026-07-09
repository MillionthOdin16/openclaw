## 2025-02-12 - Accessible Collapsible Toggles

**Learning:** When adding `aria-label` to collapsible UI toggles that already use `aria-expanded`, dynamic labels (like 'Expand [Name]' or 'Collapse [Name]') combined with `aria-expanded` create semantic redundancy and screen reader noise.
**Action:** Use a static, action-neutral label (e.g., 'Toggle [Name]') rather than dynamically changing the label text based on state.
