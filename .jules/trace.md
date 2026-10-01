## 2023-10-01 - Complete poll validation coverage
**Learning:** The poll utility functions lacked coverage for edge cases like empty questions, insufficient options, invalid multiple selections, and out-of-bounds durations. Writing precise validation tests ensures consistent behavior across different bot channels.
**Action:** Added exhaustive unit tests covering all throw conditions in "normalizePollInput" and multi-select resolution paths in "resolvePollMaxSelections" to achieve 100% test coverage.
