## 2024-05-24 - Cron Job Alerting Pattern
**Defect Pattern:** Fire-and-forget async operations without state tracking.
**Local Impact:** `emitFailureAlert` calls `state.deps.sendCronFailureAlert` asynchronously without awaiting the result, so failures in alerting are silently logged but not tracked in the job state.
**Review Strategy:** Check for unawaited async callbacks or promises in core cron/service modules, especially in error handling or notification paths.
## 2024-05-24 - Agent Sessions Pattern
**Defect Pattern:** Async gaps between session creation and work dispatch.
**Local Impact:** `spawnAcpDirect` creates a session and then dispatches work via gateway calls. If the session is reset or deleted externally between these calls, the work may be admitted incorrectly.
**Review Strategy:** Check multi-step gateway RPCs that rely on stable state across yield points, especially for session management.
