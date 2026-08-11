# 🦅 Scout: Critical Inherited Defect Report - 2026-08-11

## Upstream Issue #106866: Native QMD returns active slugified paths that do not exist on disk
* **Local File Path & Line Numbers:** `src/memory/qmd-manager.ts` lines 1746-1764 (specifically `toDocLocation` and `buildSearchPath`)
* **Expected vs. Observed Behavior:** `memory_search` is expected to return paths that actually exist on disk. Instead, it returns slugified paths that do not exist on disk because `toDocLocation` does not perform a filesystem existence check before returning the path.
* **Impact Severity:** High impact for memory reliability. This causes agents to lose or mis-handle project memory because the returned citations/paths cannot be read.

## Upstream Issue #122047: Subagent reconciliation can infer completion from a case-colliding sibling session
* **Local File Path & Line Numbers:** `src/agents/subagent-registry.ts` lines 138-148 (specifically `findSessionEntryByKey`)
* **Expected vs. Observed Behavior:** The `findSessionEntryByKey` function is expected to return `null` if the exact session key is not found. Instead, it falls back to a case-insensitive match (`key.toLowerCase() === normalized`), which causes it to return a case-colliding sibling session if the exact key is missing.
* **Impact Severity:** Medium to High state consistency issue. This causes a parent run to receive the wrong child completion outcome, potentially marking a missing or running child as complete.
