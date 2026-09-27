## 2024-03-24 - Make resizable divider keyboard accessible
**Learning:** Interactive UI components like resizable dividers need explicit accessibility attributes (tabindex, role) and keyboard event handlers (ArrowKeys) to be usable by screen readers and keyboard-only users.
**Action:** Always add tabindex="0", appropriate ARIA roles, and keyboard event handlers when building custom interactive components that don't use native HTML inputs or buttons.
