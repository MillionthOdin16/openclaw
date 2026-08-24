## 2024-08-24 - Add unit tests for core utilities

**Learning:** When increasing test coverage for utility functions, ensuring edge cases (like bigints and circular references in JSON serialization, and negative bounds in chunking/timeouts) are tested makes the suite much more robust against regressions.

**Action:** Created unit tests for `chunk-items.ts`, `safe-json.ts`, `with-timeout.ts`, and `fetch-timeout.ts`.
