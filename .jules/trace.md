## 2026-03-09 - backup-shared test coverage
**Learning:** Testing logic involving internal unexported functions like 'compareCandidates' requires constructing edge case inputs to the public exported functions that wrap them. Using mock env vars is an effective way to control internal config loading logic.
**Action:** Added full test coverage for backup-shared.ts by thoroughly testing resolveBackupPlanFromDisk with mocked filesystem symlinks and duplicate directory conditions.
