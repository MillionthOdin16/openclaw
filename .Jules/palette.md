## 2026-02-25 - Custom Separators Need Keyboard Support
**Learning:** Custom UI components like resizable dividers often lack basic accessibility (role, tabindex, keyboard support), making them invisible or unusable for screen reader and keyboard users.
**Action:** When creating interactive dividers, always implement `role="separator"`, `tabindex="0"`, `aria-valuenow`, and keyboard event handlers (`ArrowLeft`/`ArrowRight`) to ensure they are accessible.
