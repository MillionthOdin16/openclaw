## 2026-03-09 - [indexOf counting semantic correction]
**Learning:** When replacing `.split(needle).length - 1` with an `indexOf` loop for performance, advancing the search index by `pos + 1` counts overlapping matches (which changes original semantics) whereas `pos + needle.length` counts non-overlapping matches correctly matching the original `.split()` behavior.
**Action:** Always ensure the index advancement exactly replicates the substring matching semantics of the replaced implementation.
