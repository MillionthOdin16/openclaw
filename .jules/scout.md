## 2026-05-29 - State Migrations Pattern

**Defect Pattern:** Data loss during state migrations when target files are corrupted and overwriting unconditional merge logic ignores the target file failure.
**Local Impact:** When upgrading and migrating legacy session stores, if the new store target is corrupted, the data in it is completely lost and overwritten by the legacy session data.
**Review Strategy:** Check src/infra/state-migrations.ts for unconditional overwrites of target stores.

## 2026-05-29 - Secrets Apply Pattern

**Defect Pattern:** Partial/interrupted updates for configuration files result in diverged states where config has migrated but secrets haven't, leaving the entire system locked out.
**Local Impact:** The system leaves config files migrated with missing credentials, locking the user out.
**Review Strategy:** Ensure multi-file secrets writing processes are guarded.
