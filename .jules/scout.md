## 2025-05-18 - Model Fallback Pattern

**Defect Pattern:** Quota exhaustion errors (e.g., HTTP 429 'quota exceeded') are incorrectly classified as transient 'rate_limit' errors instead of persistent 'billing' errors by the failover handler, bypassing fallback chains and causing infinite retry loops.
**Local Impact:** Failover mechanism enters unbounded 5-second retry loops and prevents system from degrading gracefully to fallback models.
**Review Strategy:** Double check src/agents/pi-embedded-helpers/failover-matches.ts when adding new models or error formats.

## 2025-05-18 - Discord Monitor Pattern

**Defect Pattern:** Calling `.json()` on fetch responses without first checking `response.ok` allows non-JSON errors (like 503s) to bypass `try/catch` blocks (or throw JSON parsing errors), causing unhandled promise rejections that crash the gateway process.
**Local Impact:** Gateway crashes upon receiving non-JSON responses to fetch calls made by channels like discord/monitor.
**Review Strategy:** Double check fetch blocks to ensure response.ok checks exist before awaiting .json()
