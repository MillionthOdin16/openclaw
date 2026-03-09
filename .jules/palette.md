## 2025-03-05 - Icon-only buttons lack screen reader context

**Learning:** Icon-only buttons that rely solely on `title` attributes for tooltips often fail to provide sufficient context for screen reader users, who rely on explicit labeling like `aria-label`.
**Action:** When creating or updating icon-only interactive elements (like `.btn--icon`), explicitly define an `aria-label` attribute that matches the element's visual tooltip or `title`.
