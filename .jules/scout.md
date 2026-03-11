## 2024-05-24 - Cron Jobs Pattern
**Defect Pattern:** Nested enqueuing within single concurrency lanes causing non-reentrant deadlocks.
**Local Impact:** Features leveraging isolated or manual cron job triggers will permanently hang and timeout due to queue exhaustion blocking their inner embedded subagent execution.
**Review Strategy:** Check `enqueueCommandInLane` wrappers across any CLI-initiated or manual action that calls into lower-level runner flows (`runEmbeddedPiAgent`, etc.).

## 2024-05-24 - Telegram Polling Pattern
**Defect Pattern:** Stalled fetch promises not actively aborted on watchdog restarts.
**Local Impact:** When polling watchdog triggers a restart, the underlying `grammY` fetch requests leak, causing significant delays and temporary silent network unavailability before new requests go out.
**Review Strategy:** Inspect `telegram` and `channels` networking code for proper plumbing of `AbortController` signals to the lowest-level fetch implementations when managing lifecycles.
