## 2025-03-09 - Added ARIA labels to icon-only buttons
**Learning:** Icon-only buttons lacking `aria-label` but having `title` provide some tooltip context but do not explicitly guarantee accessible names for screen readers in all contexts.
**Action:** Always include an explicit `aria-label` on buttons that lack visible text, especially for common actions like "close", "remove", or "copy".
