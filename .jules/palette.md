## 2024-06-23 - Add missing `aria-label`s to icon-only buttons

**Learning:** Found multiple icon-only buttons (like refresh, thinking mode, focus mode, and cron filter) in the chat header that lack `aria-label`s, although they do have `title`s. Screen readers handle `title` inconsistently, while `aria-label` provides a robust, predictable accessible name for icon-only interactive elements.
**Action:** When adding icon-only buttons, always include `aria-label` alongside `title`.
