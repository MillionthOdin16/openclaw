## 2026-02-13 - Icon-Only Buttons Missing Accessible Names
**Learning:** Icon-only buttons in `ui/src/ui/app-render.helpers.ts` (Refresh, Thinking, Focus) relied solely on `title` attributes for labeling, which is insufficient for screen readers as `title` is not always announced.
**Action:** When adding icon-only buttons, always include an explicit `aria-label` attribute, even if a `title` tooltip is present.
