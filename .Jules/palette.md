## 2026-02-21 - [Icon Accessibility Pattern]
**Learning:** `src/ui/icons.ts` exports raw SVG templates without accessibility attributes. Icon-only buttons using these icons often lack `aria-label` and the icons themselves are not hidden from screen readers.
**Action:** When using `icons.ts`, always ensure the parent button has an `aria-label` and manually add `aria-hidden="true"` to the SVG or wrap it in a hidden span.

## 2026-02-21 - [PR Closure]
**Learning:** The user closed the PR "Closing per repository cleanup".
**Action:** Acknowledged and stopped work.
