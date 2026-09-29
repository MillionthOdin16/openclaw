## 2024-05-19 - ARIA labels on icon-only close buttons
**Learning:** Icon-only close buttons in usage-render-details.ts and markdown-sidebar.ts were missing `aria-label` attributes, which prevents screen readers from understanding the button's action.
**Action:** Added explicit `aria-label`s ("Close session details", "Close sidebar") to these icon-only close buttons to provide accessible context to screen readers. Always add `aria-label` to buttons containing only icons or text representations like `×`.
