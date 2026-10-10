## 2024-10-10 - Add missing ARIA labels to close and remove buttons
**Learning:** Found several generic '×' buttons used for closing details or removing filters that lacked ARIA labels, making them inaccessible to screen readers.
**Action:** Always add descriptive `aria-label`s to buttons where the visual content is purely symbolic (like '×').
