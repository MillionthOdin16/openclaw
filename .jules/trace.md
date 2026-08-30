## 2026-03-09 - Add tests for utility functions

**Learning:** I noticed there were some undocumented utilities in `src/utils` like `boolean.ts`, `safe-json.ts`, and `chunk-items.ts` that lacked unit tests. Testing these pure functions improves overall codebase reliability and coverage.

**Action:** Added comprehensive unit tests for `boolean.ts`, `safe-json.ts`, and `chunk-items.ts` covering happy paths, edge cases, custom options, and fallback behavior.
