🦅 Scout: Critical Inherited Defect Report - 2024-05-24

### 1. [Upstream Issue #43008: cron.run (manual trigger) deadlocks due to nested enqueueCommandInLane("cron") with concurrency 1](https://github.com/openclaw/openclaw/issues/43008)
* **Local File Path & Line Numbers:** `src/cron/service/ops.ts` lines 527-555
* **Observed Behavior:** Manually triggering a cron job (via UI or CLI `cron.run`) calls `enqueueRun` which wraps execution inside `enqueueCommandInLane(CommandLane.Cron)`. When the job's `runEmbeddedPiAgent` internally executes, it attempts to `enqueueCommandInLane(CommandLane.Cron)` a second time. Because the lane has a default concurrency of 1, the inner enqueue waits forever, creating a self-deadlock and timing out the job. Automatic triggers avoid this by bypassing the outer enqueue and firing `executeJobCoreWithTimeout` directly.
* **Expected Behavior:** Manual job triggers should correctly delegate or share the global `CommandLane.Cron` lock, similar to `onTimer()`, allowing the inner `runEmbeddedPiAgent` queue request to execute without deadlocking.
* **Impact Severity:** High. Any attempt to manually test or trigger cron jobs fully hangs and times out the gateway cron worker, failing to spawn isolated agent sessions.

### 2. [Upstream Issue #43233: Polling stall detected (no getUpdates for 107.67s); forcing restart.](https://github.com/openclaw/openclaw/issues/43233)
* **Local File Path & Line Numbers:** `src/telegram/polling-session.ts` lines 193-213
* **Observed Behavior:** The watchdog monitor asserts that `getUpdates` happens at least every `POLL_STALL_THRESHOLD_MS` (90s). However, under certain unrecoverable Telegram API errors or silent network drops, the API call never returns, keeping the runner visually "running" but stuck in an active stalled state. The watchdog triggers `void stopRunner()`, but in-flight `fetch` requests inside `grammY` hang for up to 30s.
* **Expected Behavior:** When the watchdog forcefully restarts the polling session, it must actively abort all pending `fetch` requests using an `AbortController` (e.g., `this.#activeFetchAbort?.abort()`) ensuring the runner stops immediately rather than leaking requests or delaying restarts.
* **Impact Severity:** High. Causes telegram channels to permanently stall and ignore user messages until manually restarted, breaking the primary interface for users on that channel.
