## 2025-03-01 - Add ARIA labels to filter chip and session close buttons
**Learning:** Found an accessibility issue pattern specific to this app's components: icon-only buttons (`×` for closing/removing) were missing ARIA labels across `usage-render-overview.ts` and `usage-render-details.ts`.
**Action:** Always verify that buttons with icon-only content (like `×` or other characters/SVGs) have a proper `aria-label` attribute to ensure screen reader accessibility.
