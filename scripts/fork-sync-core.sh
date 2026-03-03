#!/usr/bin/env bash
set -euo pipefail

BASE_REF="upstream/main"
BRANCH="sync/upstream-rollup-$(date +%Y%m%d-%H%M%S)"
CORE_FILE="scripts/sync-core-commits.txt"
INFRA_FILE="scripts/sync-infra-commits.txt"
PUSH=0
OPEN_PR=0
DRY_RUN=0

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

git fetch --quiet origin --prune
git fetch --quiet upstream --prune
git checkout -q -B "$BRANCH" "$BASE_REF"

apply_list() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  while IFS= read -r sha; do
    [[ -z "$sha" || "$sha" =~ ^# ]] && continue
    if git merge-base --is-ancestor "$sha" HEAD; then
      echo "SKIP (already in base): $sha"
      continue
    fi
    echo "PICK: $sha"
    if [[ "$DRY_RUN" -eq 0 ]]; then
      git cherry-pick -x "$sha"
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
