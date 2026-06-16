## 2026-06-16 - Add missing ARIA labels to chat action buttons

**Learning:** Icon-only control buttons in dynamic toolbars are prone to missing `aria-label` attributes when tooltips (`title`) are present, compromising screen-reader usability.
**Action:** Always pair `title` attributes with `aria-label` on icon-only interactive elements to guarantee accessible context.
