## 2026-02-25 - Resizable Dividers need Keyboard Support
**Learning:** Custom interactive elements like `resizable-divider` were missing keyboard accessibility and ARIA roles, making them unusable for screen reader users and keyboard-only users.
**Action:** When creating or reviewing custom interactive components, always ensure they have appropriate `role`, `tabindex`, and keyboard event handlers (e.g. Arrow keys for sliders/dividers).
