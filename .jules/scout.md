## 2026-08-10 - qmd-manager Pattern
**Defect Pattern:** Native QMD returns slugified active paths that do not exist on disk because `toDocLocation` does not verify the path exists before returning it.
**Local Impact:** `memory_search` will return paths that cannot be read, causing agents to fail when accessing project memory.
**Review Strategy:** Check `src/memory/qmd-manager.ts` and ensure paths are validated against the filesystem before being returned as active.

## 2026-08-10 - subagent-session-reconciliation Pattern
**Defect Pattern:** Case-insensitive session key matching causes incorrect child completion inference when the intended child session is missing and a sibling session key differs only by case.
**Local Impact:** Subagent session reconciliation may incorrectly mark a running or missing child as complete if a case-colliding sibling has finished.
**Review Strategy:** Check `src/agents/subagent-registry.ts` and `findSessionEntryByKey` to enforce case-sensitive matching for opaque IDs.
