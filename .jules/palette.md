## 2024-07-06 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Found that some generic view components (like `markdown-sidebar.ts` and `config-form.node.ts`) implement icon-only buttons with `title` attributes but lack essential `aria-label`s, which is less optimal for screen reader accessibility compared to core views like `chat.ts` which consistently include them.
**Action:** Always ensure icon-only buttons receive `aria-label`s, even if a `title` is present, to guarantee full semantic accessibility across all UI components.
