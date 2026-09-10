## 2025-02-14 - Missing ARIA labels on chat controls
**Learning:** Found a pattern in this app's components (`app-render.helpers.ts`) where icon-only buttons (Refresh, Thinking, Focus, Cron filter) relied exclusively on `title` attributes for accessibility context, which screen readers do not consistently announce.
**Action:** When adding or reviewing icon-only interactive controls (especially dynamically rendered controls), explicitly check for both `title` for sighted users and `aria-label` for screen reader accessibility. Ensure translations are properly localized for both attributes.
