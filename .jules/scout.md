## 2025-02-05 - Agent Tools Pattern
**Defect Pattern:** Multi-file operations and memory writes lack transactionality and proper mutation queue integration, leading to partial commits and lost data.
**Local Impact:** The `apply_patch` tool leaves earlier deletions committed if a later hunk fails, and concurrent sandboxed memory flushes overwrite each other, causing data loss in our fork.
**Review Strategy:** Check `src/agents/apply-patch.ts` and memory-write wrappers in `src/agents/pi-tools.read.ts` for atomic update patterns and correct queue usage.
