# 🦅 Scout: Critical Inherited Defect Report - 2025-02-05

## 1. Apply Patch Partial Commit Data Loss
* **Upstream Issue:** https://github.com/openclaw/openclaw/issues/117742
* **Local Location:** `src/agents/apply-patch.ts` lines 160-260
* **Expected Behavior:** If a multi-file patch operation rejects during execution, no hunk from the envelope should remain committed. The file system should be rolled back to its original state.
* **Observed Behavior:** The function processes hunks sequentially and performs immediate destructive operations (like deletes). If a later hunk fails, earlier destructive operations remain committed, causing permanent data loss, while the caller only sees a generic failure result.
* **Impact Severity:** Critical (P1 data loss)

## 2. Concurrent Sandbox Memory Flushes Overwrite
* **Upstream Issue:** https://github.com/openclaw/openclaw/issues/117741
* **Local Location:** `src/agents/pi-tools.read.ts` lines 514-530
* **Expected Behavior:** Concurrent append operations to a sandboxed memory file should serialize or use atomic appends, resulting in all new notes being preserved.
* **Observed Behavior:** The sandbox backend uses a read-modify-write sequence without atomic guarantees or queues. Both concurrent calls succeed, but one overwrites the other, silently losing durable memory immediately before compaction.
* **Impact Severity:** Critical (P1 data loss)
