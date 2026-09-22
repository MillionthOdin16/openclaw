## 2024-09-22 - Missing Test Coverage in backup-shared

**Learning:** Important CLI backup path logic lacked test coverage entirely, especially around overlapping path resolution and backup inclusion exclusion scenarios.

**Action:** Added comprehensive test suite for "src/commands/backup-shared.ts" focusing on "resolveBackupPlanFromDisk" using Vitest, achieving over 84% statement coverage.
