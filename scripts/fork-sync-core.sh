#!/usr/bin/env bash
set -euo pipefail

BASE_REF="upstream/main"
BRANCH="sync/upstream-rollup-$(date +%Y%m%d-%H%M%S)"
CORE_FILE="scripts/sync-core-commits.txt"
INFRA_FILE="scripts/sync-infra-commits.txt"
PUSH=0
OPEN_PR=0
DRY_RUN=0
REPO_ROOT="$(git rev-parse --show-toplevel)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-ref) BASE_REF="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --core-commits-file) CORE_FILE="$2"; shift 2 ;;
    --infra-commits-file) INFRA_FILE="$2"; shift 2 ;;
    --push) PUSH=1; shift ;;
    --open-pr) OPEN_PR=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

resolve_path() {
  local path="$1"
  if [[ "$path" = /* ]]; then
    echo "$path"
  else
    echo "$REPO_ROOT/$path"
  fi
}

CORE_FILE="$(resolve_path "$CORE_FILE")"
INFRA_FILE="$(resolve_path "$INFRA_FILE")"

git fetch --quiet origin --prune
git fetch --quiet upstream --prune
git checkout -q -B "$BRANCH" "$BASE_REF"

apply_list() {
  local file="$1"
  local line clean sha
  [[ -f "$file" ]] || return 0
  while IFS= read -r line; do
    clean="${line%%#*}"
    sha="$(echo "$clean" | xargs)"
    [[ -z "$sha" ]] && continue
    if git merge-base --is-ancestor "$sha" HEAD; then
      echo "SKIP (already in base): $sha"
      continue
    fi
    echo "PICK: $sha"
    if [[ "$DRY_RUN" -eq 0 ]]; then
      if ! git cherry-pick -x "$sha"; then
        if git diff --quiet && git diff --cached --quiet; then
          echo "SKIP (already applied): $sha"
          git cherry-pick --skip
        else
          echo "ERROR: cherry-pick failed for $sha" >&2
          exit 1
        fi
      fi
    fi
  done < "$file"
}

echo "Applying core commits from $CORE_FILE..."
apply_list "$CORE_FILE"
echo "Applying infra commits from $INFRA_FILE..."
apply_list "$INFRA_FILE"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "Dry run complete."
  exit 0
fi

if [[ "$PUSH" -eq 1 ]]; then
  git push -u origin "$BRANCH"
fi

if [[ "$OPEN_PR" -eq 1 ]]; then
  gh pr create --base main --head "$BRANCH" --title "chore(sync): upstream intake rollup" --body "Automated upstream intake from upstream/main with curated replay-safe patches."
fi
