## 2024-05-24 - Chat Accessibility Improvements
**Learning:** Icon-only buttons in the chat interface were missing accessible names, making them difficult for screen reader users to understand. Adding `aria-label` provides necessary context without changing the visual design.
**Action:** Always check icon-only buttons for `aria-label` or `title` attributes. When a button changes state (like "Send" vs "Queue"), ensure the accessible label updates to reflect the new action.
