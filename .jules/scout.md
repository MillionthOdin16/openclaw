## 2025-05-23 - [Agents] Infinite Context Growth
**Defect Pattern:** Session history management lacks default limits, leading to infinite context growth and eventual model rejection.
**Local Impact:** `src/agents/pi-embedded-runner/history.ts` `limitHistoryTurns` defaults to no limit. `readSessionMessages` reads full history.
**Review Strategy:** Check `limitHistoryTurns` usage and default configuration in `src/agents/defaults.ts`.

## 2025-05-23 - [Agents] Context Overflow Handling
**Defect Pattern:** Reactive compaction relies on error message matching which can be brittle.
**Local Impact:** `src/agents/pi-embedded-runner/run.ts` relies on `isLikelyContextOverflowError`.
**Review Strategy:** Check `src/agents/pi-embedded-helpers.ts` regexes against provider error messages.
