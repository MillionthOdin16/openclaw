## 2026-02-25 - Resizable Split Views Accessibility
**Learning:** Custom components like `resizable-divider` often rely on mouse events (dragging) and lack keyboard support, making them inaccessible to keyboard-only users.
**Action:** When implementing or modifying resizable components, always add `role="separator"`, `tabindex="0"`, and `keydown` handlers for Arrow keys to enable keyboard resizing. Ensure ARIA state attributes (`valuenow`, `valuemin`, `valuemax`) are updated dynamically.
