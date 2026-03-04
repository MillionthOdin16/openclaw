## 2025-03-01 - Cron Module
**Defect Pattern:** Edge cases with scheduling logic and time advancing incorrectly.
**Local Impact:** When gateway restarts, jobs with past-due `nextRunAtMs` may never run again.
**Review Strategy:** Check `src/cron/service/jobs.ts` and ensure time edge cases (like `nextRunAtMs <= nowMs`) correctly trigger recomputations.
