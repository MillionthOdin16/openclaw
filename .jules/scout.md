## 2026-06-17 - config/sessions/store.ts Pattern

**Defect Pattern:** Unbounded Memory Load
**Local Impact:** All session files are loaded into memory at startup using `readFileSync`, causing massive memory usage and potential OOM.
**Review Strategy:** `src/config/sessions/store.ts` should lazily load, paginate, or stream session JSONL files.

## 2026-06-17 - infra/state-migrations.ts Pattern

**Defect Pattern:** State Migrations Pattern
**Local Impact:** Target files are unconditionally overwritten during state migrations even if corrupted, causing permanent data loss due to a lack of safe fallback logic.
**Review Strategy:** `src/infra/state-migrations.ts` needs careful review to ensure target files aren't blindly overwritten.

## 2026-06-17 - agents/skills/refresh.ts Pattern

**Defect Pattern:** Chokidar FD Leak Pattern
**Local Impact:** The Chokidar file watcher targeting specific files instead of directories holds persistent read-only file descriptors, causing linear FD exhaustion.
**Review Strategy:** `src/agents/skills/refresh.ts` watch targets should use directories rather than individual files, or ensure FD lifecycle is properly bounded.

## 2026-06-17 - secrets/apply.ts Pattern

**Defect Pattern:** Secrets Apply Pattern
**Local Impact:** Updating multi-file configuration without cross-file transaction boundaries can lead to a diverged state (migrated config but unmigrated secrets) when a write faults mid-commit.
**Review Strategy:** `src/secrets/apply.ts` needs review.
