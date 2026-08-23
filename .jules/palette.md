## 2024-05-23 - Focus Visible on Button

**Learning:** Buttons without specific focus styles might lack proper focus visibility, making it hard to track current focus during keyboard navigation. Adding `:focus-visible` styles with an appropriate box-shadow on `.btn` improves the general app accessibility for users who use keyboards.
**Action:** Always implement `:focus-visible` styles for interactive elements, particularly common utility classes like `.btn`.
