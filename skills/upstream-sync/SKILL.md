---
name: upstream-sync
description: |
  **Use when:** Syncing local main with origin/main while preserving local fixes; handling diverged histories, protected branches, and rebase workflows.
  **Don't use when:** Simple fast-forward updates (use `git pull`), or when working on feature branches (use worktrees).
  **Outputs:** Synchronized branch, verified delta, protected branch status preserved.
---

# Upstream Sync (OpenClaw)

Goal: stay as close to `origin/main` as possible **without losing** local customizations and fixes, and verify that upstream changes did not introduce regressions.

## Non-negotiables (safety)

- **Never** use `git reset --hard` to update from origin.
- **Never** use `git pull` without `--rebase`.
- **Never** use `git stash` (easy to lose work or conflict with other agents).
- Keep local changes in **small, focused commits** so they are easy to drop or update.
- Always run **targeted tests** after syncing.
- **Always restore branch protection** after force pushing.

## One-time setup

```bash
git config rerere.enabled true
git config rerere.autoupdate true
```

## Diverged/Unrelated Histories Workflow

When `main` and `origin/main` have no common ancestor (e.g., after repo rebrand/migration):

### 1. Assess the situation

```bash
# Check if branches are related
git merge-base --is-ancestor origin/main main && echo "Related" || echo "Diverged"
git merge-base main origin/main 2>&1 || echo "No common ancestor"

# View first commits of each
git log --oneline --reverse origin/main | head -3
git log --oneline --reverse main | head -3
```

### 2. Decide on approach

**Option A: Force push local to fork** (when local has correct/current code)

- Preserves your local commits
- Replaces fork history entirely
- Use when fork has obsolete history (e.g., old warelay → new clawdbot)

**Option B: Cherry-pick to fresh branch** (when you want to keep both histories)

- Create new branch from origin/main
- Cherry-pick meaningful local commits
- More work but preserves archaeology

### 3. Force push with branch protection bypass

```bash
# Temporarily allow force pushes
echo '{"required_status_checks":null,"enforce_admins":null,"required_pull_request_reviews":null,"restrictions":null,"allow_force_pushes":true}' | \
  gh api repos/OWNER/REPO/branches/main/protection \
  --method PUT -H "Accept: application/vnd.github+json" --input -

# Force push
git push fork main --force-with-lease

# Restore protection
echo '{"required_status_checks":null,"enforce_admins":null,"required_pull_request_reviews":null,"restrictions":null,"allow_force_pushes":false}' | \
  gh api repos/OWNER/REPO/branches/main/protection \
  --method PUT -H "Accept: application/vnd.github+json" --input -
```

### 4. Verify protection restored

```bash
gh api repos/OWNER/REPO/branches/main/protection --method GET | grep allow_force
```

## Routine sync workflow (safe path)

For when you have a normal fork relationship with common history:

1. **Clean working tree**:

   ```bash
   git status -sb
   # If dirty, commit with scripts/committer first.
   ```

2. **Fetch and assess**:

   ```bash
   git fetch origin
   git log --oneline --left-right --decorate main...origin/main
   ```

3. **Rebase onto upstream** (never reset):

   ```bash
   git rebase origin/main
   ```

4. **Resolve conflicts** → `git add ...` → `git rebase --continue`.

5. **Push to fork** (if protected, use bypass workflow above):
   ```bash
   git push fork main --force-with-lease
   ```

## Verification + regression audit (required)

After rebase, verify correctness and regression safety:

1. **Run targeted tests** for touched areas first.
2. **Run repo checks** (if recent changes are broad):
   ```bash
   pnpm check
   pnpm build
   pnpm test -- <targeted tests>
   ```
3. **Audit critical pipelines** when upstream changes are large:
   - **Messaging pipeline**: channel routing, followup queue, reply handling.
   - **Command pipeline**: command queue, lanes, and /status output.
   - **Schedule pipeline**: cron/isolated agents and session usage.
4. **Document external failures** (deps/creds) separately so they don't mask regressions.

## Dropping redundant local fixes

If upstream includes a fix with parity, drop the local commit(s):

```bash
git rebase -i origin/main
# drop commits that are now redundant
```

Then re-run targeted tests for parity.

## Examples

### Full sync with protected branch bypass

```bash
# 1. Fetch upstream
git fetch origin

# 2. Check relationship
if ! git merge-base --is-ancestor origin/main main 2>/dev/null; then
  echo "Diverged histories - will rebase then force push"
fi

# 3. Rebase
git rebase origin/main

# 4. Temporarily disable protection
echo '{"required_status_checks":null,"enforce_admins":null,"required_pull_request_reviews":null,"restrictions":null,"allow_force_pushes":true}' | \
  gh api repos/OWNER/REPO/branches/main/protection --method PUT -H "Accept: application/vnd.github+json" --input -

# 5. Push
git push fork main --force-with-lease

# 6. Restore protection
echo '{"required_status_checks":null,"enforce_admins":null,"required_pull_request_reviews":null,"restrictions":null,"allow_force_pushes":false}' | \
  gh api repos/OWNER/REPO/branches/main/protection --method PUT -H "Accept: application/vnd.github+json" --input -

# 7. Verify
git log --oneline --left-right --decorate main...origin/main | head -5
```

### Standard update (no protection needed)

```bash
git fetch origin
git rebase origin/main
git range-diff origin/main...main
pnpm test -- <targeted tests>
git push fork main --force-with-lease
```

### Deep verification sweep (post-rebase)

```bash
pnpm check
pnpm build
pnpm test -- status.test.ts
pnpm test -- agent-runner
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

### Diverged histories (no merge base)

```bash
# Check if related
git merge-base main origin/main 2>&1 || echo "No common ancestor"

# If diverged, choose:
# A) Force push local (if local is correct)
# B) Reset to upstream and cherry-pick (if upstream is canonical)
```

### Protected branch blocks push

```bash
# Use GitHub API to temporarily disable
echo '{"allow_force_pushes":true}' | gh api repos/OWNER/REPO/branches/main/protection --method PATCH -H "Accept: application/vnd.github+json" --input -
git push fork main --force-with-lease
echo '{"allow_force_pushes":false}' | gh api repos/OWNER/REPO/branches/main/protection --method PATCH -H "Accept: application/vnd.github+json" --input -
```

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
- Add regression tests for fixes you keep.

### Lost changes (rare)

- Check `git reflog` for the missing commit.
- Restore with `git reset --hard <sha>` on a temporary branch, then cherry-pick.

## GitHub API Prerequisites

For branch protection bypass, you need:

1. **GitHub CLI authenticated**:

   ```bash
   gh auth status
   # Should show: token scopes include 'repo'
   ```

2. **Admin access to the repository**:

   ```bash
   gh api repos/OWNER/REPO --jq '.permissions.admin'  # should be true
   ```

3. **Current protection state**:
   ```bash
   gh api repos/OWNER/REPO/branches/main/protection --method GET
   ```

## Repo-specific notes

- Prefer `scripts/committer "<msg>" <files...>` for commits.
- Use `pnpm` commands (Node 22+) for builds/tests.
- Repo shorthand `sync` commits all changes then runs `git pull --rebase`; use **only** when you explicitly want to commit everything.
- Do **not** use `git pull --rebase --autostash` or `git stash` (work can be lost).
- Do **not** modify `node_modules/` or patch dependencies without explicit approval.
- Do **not** change versions unless explicitly requested.
- Avoid switching branches or creating worktrees unless explicitly asked.
- **Always restore branch protection** after force pushing.
