## 2024-10-11 - Add ARIA accessibility and keyboard support to resizable-divider

**Learning:** The resizable divider lacks basic accessibility (like role, aria-label, aria-orientation, and keyboard support for users relying on keyboard navigation). This makes resizing the split view impossible or confusing for screen readers and keyboard users.
**Action:** Always add keyboard interaction support (arrow keys for resizing), appropriate ARIA roles (separator), and labels to interactive drag handles, ensuring they are focusable.
