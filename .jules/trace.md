## 2024-10-08 - Improve test coverage for display functions in utils.ts

**Learning:** Functions related to formatting and path manipulation were mostly untested, leading to poor code coverage in `utils.ts`.
**Action:** Added targeted unit tests for `displayPath`, `displayString`, `formatTerminalLink`, and various edge cases in `shortenHomePath` and `shortenHomeInString`.

## 2024-10-08 - Improve test coverage for slice/truncate functions in utils.ts

**Learning:** Functions related to string manipulation (sliceUtf16Safe, truncateUtf16Safe) were missing test coverage in `utils.ts`.
**Action:** Added targeted unit tests for `sliceUtf16Safe` and `truncateUtf16Safe` to correctly handle surrogate pairs and normal cases.
