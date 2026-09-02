## 2024-05-24 - Poll Parameters Testing Enhancements
**Learning:** Discovered uncovered error handling logic and boundary conditions in poll parameters normalization, specifically concerning duration and selection constraints.
**Action:** Added extensive tests covering all validation boundary conditions and edge cases in `normalizePollInput` and `resolvePollMaxSelections`, raising branch coverage to 100%.
