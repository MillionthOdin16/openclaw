## 2024-05-09 - Custom Provider Pattern
**Defect Pattern:** We keep inheriting hardcoded minimums or defaults that conflict with gateway compaction minimums.
**Local Impact:** Our fork suffers immediate infinite compacting loops (e.g. `reserveTokensFloor` vs `DEFAULT_CONTEXT_WINDOW`) upon configuration.
**Review Strategy:** Check for hardcoded `DEFAULT_CONTEXT_WINDOW` defaults across all new provider onboarding logic to ensure they exceed `DEFAULT_PI_COMPACTION_RESERVE_TOKENS_FLOOR`.
