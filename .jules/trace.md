## 2024-05-18 - Improve Poll Input Validation Coverage
**Learning:** Error throwing conditions for invalid inputs in src/polls.ts lacked test coverage, specifically regarding input lengths and out of bounds values.
**Action:** Added comprehensive test suites to src/polls.test.ts to ensure edge cases throw expected validation errors, verifying 100% test coverage for polls.ts.
