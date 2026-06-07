## 2026-06-07 - Missing ARIA labels on Icon-Only Buttons

**Learning:** Found a recurring pattern where icon-only buttons (using text like "×" or SVG icons) include `title` attributes for sighted users but lack `aria-label` attributes, making them inaccessible or confusing to screen readers.
**Action:** Always pair visual tooltips (`title`) with explicit semantic `aria-label` attributes on icon-only buttons to ensure they remain accessible for assistive technology.
