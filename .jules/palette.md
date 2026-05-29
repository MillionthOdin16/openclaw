## 2026-05-29 - Missing ARIA labels in icon-only buttons

**Learning:** The chat controls buttons were missing accessible labels. When an interactive element only contains an icon (e.g. `${icons.brain}` or `${refreshIcon}`) with no visible text, it must have an `aria-label` (or `title`) so screen readers can interpret its purpose, following WCAG standards. The `ui/src/ui/app-render.helpers.ts` file had multiple icon-only buttons missing `aria-label`.
**Action:** Added context-aware `aria-label`s (which also leverage translation files) to these buttons to ensure consistent screen reader support. Next time, actively check for the pattern `<button class="btn btn--icon">...${icon}...</button>` without an `aria-label`.

## 2026-05-29 - Missing ARIA labels in icon-only buttons

**Learning:** The chat controls buttons were missing accessible labels. When an interactive element only contains an icon (e.g. `${icons.brain}` or `${refreshIcon}`) with no visible text, it must have an `aria-label` (or `title`) so screen readers can interpret its purpose, following WCAG standards. The `ui/src/ui/app-render.helpers.ts` file had multiple icon-only buttons missing `aria-label`.
**Action:** Added context-aware `aria-label`s (which also leverage translation files) to these buttons to ensure consistent screen reader support. Next time, actively check for the pattern `<button class="btn btn--icon">...${icon}...</button>` without an `aria-label`.
