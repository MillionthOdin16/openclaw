## 2024-08-27 - Test polls missing coverage

**Learning:** `src/polls.ts` missed test cases for edge cases such as empty questions, fewer than 2 valid options, invalid maxSelections, invalid durationSeconds, invalid durationHours, and missed tests for `resolvePollMaxSelections` method.

**Action:** Added complete missing tests in `src/polls.test.ts` using Vitest which boosted the coverage to 100% for `src/polls.ts`
