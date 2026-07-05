## 2024-07-05 - Added explicit ARIA labels to nav group toggle buttons
**Learning:** Buttons that toggle navigation groups (collapsible sections) need explicit `aria-label` attributes describing their specific action (e.g., "Expand Chat group") in addition to `aria-expanded` state. Relying solely on the visible label text + state isn't as clear for screen reader users navigating interactively.
**Action:** Always provide explicit action-oriented `aria-label` attributes for collapsible section toggles.
