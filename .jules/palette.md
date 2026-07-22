## 2023-10-24 - Add ARIA labels to icon-only buttons
**Learning:** Icon-only buttons (like `×` for close/remove) in the dashboard/usage components lack accessible names, making them inaccessible to screen readers.
**Action:** Always add descriptive `aria-label` attributes to buttons that only contain icons or single non-descriptive characters.
