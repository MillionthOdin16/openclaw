## 2026-05-28 - [Memory Index Manager] Pattern

**Defect Pattern:** Hard-dropping sqlite virtual vector tables (e.g., sqlite-vec) during unsafe reindex operations without re-initializing dimensions.
**Local Impact:** Prepared statements that reference these dropped tables crash with "no such table: chunks_vec" when the reindex attempts to use them before vector dims are lazily established by chunk processing.
**Review Strategy:** Review forced reindex/reset functions in memory components to ensure virtual table schemas are preserved and cleared via DELETE rather than dropped outright.
