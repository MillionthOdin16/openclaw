## 2024-05-20 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Found an accessibility issue pattern where icon-only buttons (like `×` close/remove buttons) only used `title` attributes instead of `aria-label`. This makes them inaccessible to screen readers which don't announce titles reliably for elements lacking text.
**Action:** Always ensure that icon-only interactive elements (like buttons) include a descriptive `aria-label` even if they have a `title` attribute for mouse hover.
