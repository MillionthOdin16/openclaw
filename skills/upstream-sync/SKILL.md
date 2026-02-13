---
name: upstream-sync
description: Keep local main aligned with origin/main while preserving local fixes; rebase + range-diff workflow.
---

# Upstream Sync (OpenClaw)

Goal: stay as close to `origin/main` as possible **without losing** local customizations and fixes.

## One-time setup

```bash
git switch -c local-main
git config rerere.enabled true
git config rerere.autoupdate true
```

## Routine sync workflow (safe path)

1. **Fetch only**:
   ```bash
   git fetch origin
   git status -sb
   ```
2. **Rebase onto upstream** (never reset):
   ```bash
   git rebase origin/main
   ```
3. **Resolve conflicts** → `git add ...` → `git rebase --continue`.
4. **Verify** with targeted tests for changed areas.
5. **Review delta**:
   ```bash
   git range-diff origin/main...local-main
   ```

## Dropping redundant local fixes

If upstream includes a fix with parity:

```bash
git rebase -i origin/main
# drop the local commit(s) now covered upstream
```

## Commit discipline (important)

- Keep **small, focused** commits per customization.
- Prefer `scripts/committer "<msg>" <files...>` unless told otherwise.
- Avoid `git reset --hard`, `git stash`, or `git pull` without `--rebase`.

## Recovery

- Abort a bad rebase: `git rebase --abort`
- Recover lost state: `git reflog` → `git reset --hard <good-sha>` (last resort, confirm first)

## Repo-specific notes

- This repo provides a shorthand `sync` command that commits all changes then runs `git pull --rebase`.
  Use it **only** if you want to commit everything; otherwise use the manual flow above.
