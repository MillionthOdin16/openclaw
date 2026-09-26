## 2024-03-09 - Icon-only close buttons require aria-labels

**Learning:** Icon-only close buttons (like "×" or an icon SVG) must have explicit aria-label attributes for screen readers. A title attribute or a bare "×" character is insufficient for accessibility.
**Action:** Always verify icon-only buttons include an aria-label matching their action (e.g., "Close", "Remove").
