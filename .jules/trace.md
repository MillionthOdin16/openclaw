## 2024-05-24 - Edge Case Testing in Transcript Tools
**Learning:** Type handling utilities for parsing AI message schemas require comprehensive tests covering non-object array items (like null and strings) and invalid primitive type fields to guarantee robust operation.
**Action:** Added new tests in src/utils/transcript-tools.test.ts that supply array structures containing undefined, null, primitive types, and numbers in place of objects or strings to extractToolCallNames and countToolResults, closing coverage gaps and solidifying schema resilience.
