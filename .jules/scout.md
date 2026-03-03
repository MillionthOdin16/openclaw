## 2024-03-03 - [pi-embedded-runner] Pattern
**Defect Pattern:** The `runEmbeddedPiAgent` function in `src/agents/pi-embedded-runner/run.ts` fails to emit `compaction` stream events during overflow compaction.
**Local Impact:** This causes `compactionCount` desynchronization and breaks memory flushes (Issue #14143).
**Review Strategy:** Check for missing event emissions during auto-compaction workflows, specifically looking for `onAgentEvent` or `emitAgentEvent` calls in `src/agents/pi-embedded-runner/run.ts`.
