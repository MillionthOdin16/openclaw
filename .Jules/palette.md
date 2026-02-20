## 2026-02-16 - [Accessibility Gap: Icon-Only Buttons]
**Learning:** The codebase frequently uses `title` attributes for icon-only buttons (like refresh, settings toggles) but consistently misses `aria-label`, making them inaccessible to screen readers.
**Action:** When implementing new icon-only buttons or auditing existing ones, always ensure `aria-label` is present alongside `title` to provide a robust accessible name.
