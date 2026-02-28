## 2026-02-28 - Custom Resizable Dividers Accessibility

**Learning:** Custom UI components like `ResizableDivider` must implement `role='separator'`, `tabindex='0'`, `aria-orientation`, and keyboard event handlers (Arrow keys) to ensure accessibility.
**Action:** Always verify that custom interactive components have equivalent keyboard interactions to their pointer-based interactions, and that they present the correct role to screen readers.
