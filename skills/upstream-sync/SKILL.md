---
name: upstream-sync
description: Keep local main aligned with origin/main while preserving local fixes; rebase + range-diff workflow.
---

# Upstream Sync (OpenClaw)

Goal: stay as close to `origin/main` as possible **without losing** local customizations and fixes.

## Non-negotiables (safety)

- **Never** use `git reset --hard` to update from origin.
- **Never** use `git pull` without `--rebase`.
- **Never** use `git stash` (easy to lose work or conflict with other agents).
- Keep local changes in **small, focused commits** so they are easy to drop or update.
- Always run **targeted tests** after syncing.

## One-time setup

```bash
git switch -c local-main
git config rerere.enabled true
git config rerere.autoupdate true
```

Optional safety branch before major rebases:

```bash
git branch backup/local-main-$(date +%Y%m%d)
```

## Routine sync workflow (safe path)

1. **Clean working tree**:
   ```bash
   git status -sb
   # If dirty, commit with scripts/committer first.
   ```
2. **Fetch only**:
   ```bash
   git fetch origin
   ```
3. **Rebase onto upstream** (never reset):
   ```bash
   git rebase origin/main
   ```
4. **Resolve conflicts** → `git add ...` → `git rebase --continue`.
5. **Verify** with targeted tests for changed areas.
6. **Review delta**:
   ```bash
   git range-diff origin/main...local-main
   ```

## Dropping redundant local fixes

If upstream includes a fix with parity, drop the local commit(s):

```bash
git rebase -i origin/main
# drop commits that are now redundant
```

Then re-run targeted tests for parity.

## Examples

### Standard update

```bash
git fetch origin
git rebase origin/main
git range-diff origin/main...local-main
pnpm test -- <targeted tests>
```

### Resolve a conflict during rebase

```bash
git status
# edit conflict files
git add <files>
git rebase --continue
```

### Drop a redundant local fix after upstream parity

```bash
git rebase -i origin/main
# mark local commit(s) as "drop"
pnpm test -- <targeted tests>
```

## Troubleshooting

### Rebase conflict loops

- Enable rerere (done in setup).
- Resolve once, then continue; rerere should auto-apply next time.

### Rebase went wrong

```bash
git rebase --abort
```

If you need to recover a prior state:

```bash
git reflog
git reset --hard <good-sha>  # last resort, confirm first
```

### Failing tests after rebase

- Identify the upstream change that introduced the failure.
- If your local customization now conflicts with upstream behavior, update your commit or drop it if upstream is better.
- Re-run only the affected test suites to confirm.

### Lost changes (rare)

- Check `git reflog` for the missing commit.
- Restore with `git reset --hard <sha>` on a temporary branch, then cherry-pick.

## Repo-specific notes

- Prefer `scripts/committer "<msg>" <files...>` for commits.
- Use `pnpm` commands (Node 22+) for builds/tests.
- Repo shorthand `sync` commits all changes then runs `git pull --rebase`; use **only** when you explicitly want to commit everything.
- Do **not** use `git pull --rebase --autostash` or `git stash` (work can be lost).
- Do **not** modify `node_modules/` or patch dependencies without explicit approval.
- Do **not** change versions unless explicitly requested.
- Avoid switching branches or creating worktrees unless explicitly asked.
