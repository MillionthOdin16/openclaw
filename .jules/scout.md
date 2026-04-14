## 2026-04-14 - Model Fallback Pattern
**Defect Pattern:** Quota exhaustion and billing cooldown errors are frequently misclassified by string-matching rules.
**Local Impact:** Errors like "quota exceeded" or "has billing issue" fail to trigger the persistent billing error handling, resulting in generic user-facing errors or infinite retry loops that bypass fallback chains.
**Review Strategy:** Double-check `failover-matches.ts` (`isBillingErrorMessage` and `ERROR_PATTERNS`) and `errors.ts` whenever upstream changes fallback error handling.
