## 2026-09-09 - SQLite Synchronous Locking Pattern
**Defect Pattern:** We inherited OpenClaw's synchronous SQLite database writes for intense background processes (like memory indexing). Under contention, these synchronous writes deadlock, blocking the entire Node event loop indefinitely because libuv's sync-FS path holds the main thread.
**Local Impact:** If an operator triggers a massive memory reindex in our fork, the Gateway process becomes entirely unresponsive to all channels and API endpoints, cannot be gracefully killed via SIGTERM, and leaves behind stale 0-byte lock files that permanently break future indexing attempts until manually removed.
**Review Strategy:** Any new files handling local database access must be scrutinized to ensure they use asynchronous "node:sqlite" transactions or offload heavy I/O to worker threads.
## 2026-09-09 - Upstream AI Model Prefix Sensitivity Pattern
**Defect Pattern:** We inherited OpenClaw's hardcoded message prefix metadata format (e.g., "[cron:<jobId> <jobName>]") which specifically triggers edge-case queuing deprioritization in upstream LLM providers (specifically DeepSeek), leading to massive first-token latency.
**Local Impact:** Any scheduled background agents relying on this format in our fork will stall for 10-95s before starting, causing cascading timeouts, failed scheduled jobs, and wasted API quotas.
**Review Strategy:** Check for any hardcoded string formats used as system or user message prefixes, and ensure they are tested against upstream edge cases.
