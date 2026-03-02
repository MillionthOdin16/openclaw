## 2025-03-09 - Accessible Resizable Dividers

**Learning:** Custom UI components acting as resizable dividers must implement ARIA semantics (`role="separator"`, `tabindex="0"`, `aria-orientation`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`) and keyboard navigation support (Arrow keys) to ensure accessibility for screen readers and keyboard users.
**Action:** When creating or modifying custom interactive components (like dividers or sliders), ensure full keyboard support and proper ARIA states are implemented explicitly.
