## 2026-02-20 - [Lit HTML Accessibility]
**Learning:** Lit HTML templates for icon-only buttons require explicit `aria-label` attributes as `title` is insufficient for accessibility compliance.
**Action:** Always verify icon-only buttons in rendering helpers (like `app-render.helpers.ts`) have `aria-label` bound to a translation key.
