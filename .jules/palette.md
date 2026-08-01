## 2024-03-24 - Accessibility Improvement
**Learning:** Icon-only buttons without aria-labels are a common accessibility issue in UI components. In this case, the `markdown-sidebar.ts` close button was only conveying its purpose visually via an icon and a tooltip (`title`).
**Action:** Always ensure icon-only buttons have an explicit `aria-label` attribute to provide proper context for screen readers.
