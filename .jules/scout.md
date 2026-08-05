## 2024-05-24 - Session Compaction Pattern
**Defect Pattern:** We inherit faulty token accounting logic that falls back to cumulative multi-turn usage rather than a true context snapshot.
**Local Impact:** In our fork, this causes premature session compaction and irreversible conversation data loss when the inflated token counts breach the budget threshold early.
**Review Strategy:** Scrutinize `src/auto-reply/reply/session-usage.ts` and `src/agents/usage.ts` for any fallback logic that mixes accumulated run totals with context window state.
