## 2024-07-08 - Accessible Filter Chip Remove Buttons
**Learning:** Dynamic "remove filter" buttons (x icons) without explicit ARIA labels provide no context to screen reader users about which specific filter is being removed.
**Action:** Always add specific `aria-label` attributes to icon-only remove buttons (e.g., "Remove days filter") rather than relying on generic tooltips.
