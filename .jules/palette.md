## 2023-10-27 - [Configuration Form Button ARIA Labels]
**Learning:** Icon-only buttons or buttons using abstract characters (like `↺`, `+`, `-`) in the `config-form.node.ts` component lack accessible names because they only contain the visual symbol.
**Action:** Always provide an explicit `aria-label` for buttons that don't have clear descriptive text.
