## 2024-05-24 - Improve Polls Input Validation Test Coverage
**Learning:** Testing validation logic in pure functions requires explicitly covering all expected error conditions thrown by boundary conditions. Checking happy paths isn't enough to prevent regressions when input requirements change.
**Action:** Added comprehensive negative tests to `src/polls.test.ts` for all validation bounds in `normalizePollInput` and boundary scenarios in `resolvePollMaxSelections`, bringing statement, branch and function coverage from ~75% to 100%.
