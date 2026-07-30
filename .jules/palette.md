## 2026-03-09 - Added ARIA labels to icon-only buttons in config form
**Learning:** Icon-only buttons (like "+", "-", reset, delete) often lack clear context for screen readers. Using `aria-label` provides this context without cluttering the visual UI.
**Action:** Always check interactive elements, especially those relying on icons or symbols, to ensure they have descriptive `aria-label` attributes for accessibility.
