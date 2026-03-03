# Fork Upstream Sync (Core Patch Workflow)

Use `scripts/fork-sync-core.sh` to sync from `upstream/main`, then replay curated fixes.

## Inputs

- `scripts/sync-core-commits.txt` (core runtime fixes; currently intentionally empty)
- `scripts/sync-infra-commits.txt` (infra fixes)

## Standard flow

```bash
scripts/fork-sync-core.sh --dry-run
scripts/fork-sync-core.sh --push --open-pr
```

## Policy

- Only keep replay-safe SHAs proven on clean `upstream/main`.
- Do not add PR-head SHAs.
- Remove SHAs that become upstream-equivalent.
