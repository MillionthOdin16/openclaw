# Palette's Journal

## 2025-05-15 - Icon Accessibility in Lit
**Learning:** Icon-only buttons in `app-render.helpers.ts` were missing `aria-label`, relying on `title`. Icons from `icons.ts` are `TemplateResult`s and don't include `aria-hidden` by default.
**Action:** When using icons inside accessible buttons, add `aria-label` to the button and wrap the icon `TemplateResult` in `<span aria-hidden="true" style="display: contents;">` to hide it from screen readers without affecting layout. For inline SVGs, add `aria-hidden="true"` directly to the `<svg>` tag.
