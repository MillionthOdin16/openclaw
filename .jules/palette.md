## 2026-09-21 - Added aria-labels to icon-only filter remove buttons

**Learning:** Found multiple instances where interactive icon-only buttons (using ×, ↑, ↓) lack an aria-label. Relying on title attributes alone is insufficient for screen readers as they will often just read the generic role and literal character.
**Action:** When creating icon-only buttons in the UI, especially for repeated interactive elements like filter chips, ensure both a title (for sighted users on hover) and an explicit aria-label (for screen readers) are provided.
