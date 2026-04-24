## 2025-02-14 - SQLite Vector Memory Sync Pattern
**Defect Pattern:** Calling `dropVectorTable()` drops the virtual vector table, but pre-compiled statements or subsequent immediate inserts might expect the vector table to still exist, crashing the sync/reindex operations.
**Local Impact:** `OPENCLAW_TEST_FAST=1` runs which trigger `runUnsafeReindex` will crash if SQLite vector memory index is enabled, making it unusable for fast tests or Windows force-reindex workarounds.
**Review Strategy:** Check any SQLite operations in `manager-sync-ops.ts` or related memory backend files that do table dropping / clearing to ensure pre-compiled statements are safe.
