# 🦅 Scout: Critical Inherited Defect Report - 2024-05-24

**Upstream Issue #118772: sessionEntry.totalTokens inflation causes premature compaction (data loss)**
* **Location in our code:** `src/auto-reply/reply/session-usage.ts` line 78
* **Observed Behavior:** When `lastCallUsage` is missing, the accounting logic incorrectly falls back to `params.usage` (which accumulates tokens across multiple multi-tool-loop calls). This inflates `sessionEntry.totalTokens` drastically beyond the actual prompt size, forcing the system into premature, destructive context compaction that silently discards real conversation data.
* **Expected Behavior:** `sessionEntry.totalTokens` should strictly reflect the context size of the most recent API call (`lastCallUsage`). The fallback to cumulative `usage` must be audited or removed to ensure context utilization accurately tracks the true prompt size and prevents needless data loss.
* **Impact Severity:** High / Critical (Data Loss)
