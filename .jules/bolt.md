## 2026-02-13 - Large Session File Loading
**Learning:** `readSessionMessages` loads the entire session file into memory and parses it line-by-line using `split`, which creates a huge array of strings. This causes high memory usage (3x-4x file size) for large session transcripts.
**Action:** In future optimizations, consider using stream-based processing or an iterative parser for large session files to reduce memory footprint.
