## 2023-10-27 - Button focus visible styles
**Learning:** Found that `.btn` component classes didn't have explicit `:focus-visible` styles implemented in `ui/src/styles/components.css`, leading to poor accessibility for keyboard navigation on elements like standard buttons.
**Action:** Added explicit `:focus-visible` with a clear `var(--focus-ring)` to `.btn` class for improved visual focus indicators when navigating using the keyboard.
