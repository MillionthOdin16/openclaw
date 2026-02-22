#!/bin/bash
set -e

# Configuration
UPSTREAM_REMOTE="upstream"
ORIGIN_REMOTE="origin"
SOURCE_BRANCH="main"
BASE_BRANCH="upstream/main"

# Ensure upstream is fetched
echo "Fetching upstream..."
git fetch $UPSTREAM_REMOTE

# Function to create a feature branch
create_feature_branch() {
    BRANCH_NAME=$1
    COMMIT_MSG=$2
    # Convert remaining arguments to an array of files
    shift 2
    FILES=("$@")

    echo "--------------------------------------------------"
    echo "Processing branch: $BRANCH_NAME"

    # Check if branch exists locally, delete if so (for clean reconstruction)
    if git show-ref --verify --quiet refs/heads/$BRANCH_NAME; then
        echo "Branch $BRANCH_NAME exists. Deleting..."
        git branch -D $BRANCH_NAME
    fi

    # Checkout clean base
    echo "Creating branch from $BASE_BRANCH..."
    git checkout -b $BRANCH_NAME $BASE_BRANCH

    # Checkout files from source
    echo "Extracting files from $SOURCE_BRANCH..."
    HAS_CHANGES=false

    for file in "${FILES[@]}"; do
        # Use git checkout with wildcards if provided in the string
        # We use 'eval' or just pass it if it's a simple path.
        # Since git checkout accepts pathspecs, we can pass wildcards directly if expanded by shell,
        # but here we are in a loop.

        # If the file string contains *, let git handle it
        if git checkout $SOURCE_BRANCH -- $file 2>/dev/null; then
            echo "  Checked out: $file"
            HAS_CHANGES=true
        else
            echo "  [WARN] File not found in source or failed to checkout: $file"
        fi
    done

    # Check if there are staged changes
    if git diff --cached --quiet; then
        echo "  [INFO] No changes to commit for $BRANCH_NAME (files match upstream or empty)."
        # Clean up empty branch if needed, or leave it
        git checkout $SOURCE_BRANCH
        git branch -D $BRANCH_NAME
    else
        # Commit
        git commit -m "$COMMIT_MSG"
        echo "  Committed changes."

        # Push to origin
        echo "  Pushing to $ORIGIN_REMOTE..."
        git push -u $ORIGIN_REMOTE $BRANCH_NAME

        # Output PR instructions
        echo "  [ACTION REQUIRED] Create PR: gh pr create --title \"$COMMIT_MSG\" --body \"Extracted from local main.\" --base main --head $BRANCH_NAME"
    fi

    # Return to source for next iteration
    git checkout $SOURCE_BRANCH
}

# --- 1. Critical Queue System Fixes ---
# Combines 1.1, 1.2, 1.3, 5.1
create_feature_branch "fix/queue-system-critical" \
    "fix(queue): add drain timeout, max retries, and diagnostics" \
    "src/auto-reply/reply/queue/drain.ts" \
    "src/auto-reply/reply/queue/drain.fixes.test.ts" \
    "docs/queue-fixes-2026-02-21.md"

# --- 2. Provider Authentication & Usage ---

# 2.1 Kimi Portal OAuth
create_feature_branch "feat/kimi-portal-oauth" \
    "feat(auth): add Kimi Portal OAuth extension" \
    "extensions/kimi-portal-auth/"

# 2.2 Kimi Usage Tracking
create_feature_branch "feat/kimi-usage-tracking" \
    "feat(usage): add Kimi API usage tracking" \
    "src/infra/provider-usage.fetch.kimi.ts" \
    "src/infra/provider-usage.auth.ts" \
    "src/infra/provider-usage.types.ts" \
    "src/infra/provider-usage.shared.ts" \
    "src/infra/provider-usage.load.ts"

# 2.3 MiniMax Portal OAuth
create_feature_branch "feat/minimax-portal-oauth" \
    "feat(auth): add MiniMax Portal OAuth extension" \
    "extensions/minimax-portal-auth/"

# 2.4 Qwen Portal OAuth
create_feature_branch "feat/qwen-portal-oauth" \
    "feat(auth): add Qwen Portal OAuth extension" \
    "extensions/qwen-portal-auth/"

# 2.5 Provider Usage Display Improvements
create_feature_branch "feat/provider-usage-display" \
    "feat(status): improve provider usage display and fallback indication" \
    "src/auto-reply/reply/commands-status.ts"

# --- 3. Session Management ---

# 3.1 Slash Command Immediate Execution
create_feature_branch "fix/slash-command-immediate-exec" \
    "fix(commands): execute slash commands immediately bypassing queue" \
    "src/agents/pi-embedded-runner.ts" \
    "src/agents/pi-embedded.ts" \
    "src/auto-reply/reply/commands-compact.ts"

# 3.2 & 3.3 Compaction Fallback & Status
create_feature_branch "fix/compaction-fallback" \
    "fix(compaction): add fallback model support and status indication" \
    "src/config/sessions/types.ts" \
    "src/commands/agent/session-store.ts" \
    "src/auto-reply/reply/commands-compact.ts" \
    "src/auto-reply/reply/commands-status.ts"

# 3.4 Session File Path Handling
create_feature_branch "fix/session-path-handling" \
    "fix(session): improve file path handling and symlink resolution" \
    "src/agents/session-path.ts"

# --- 4. Tool Display ---

# 4.1 & 4.2 Tool Display Improvements
create_feature_branch "feat/tool-display-improvements" \
    "feat(ui): improve real-time tool result display and verbosity" \
    "src/agents/tool-display-common.ts" \
    "src/agents/tool-display.e2e.test.ts"

# --- 5. Gateway Reliability ---

# 5.3 Retry and Failover
create_feature_branch "fix/retry-failover-logic" \
    "fix(failover): improve retry logic and error classification" \
    "src/agents/model-failover.ts" \
    "src/agents/auth-profiles.ts"

# 5.4 Stop Command
create_feature_branch "fix/stop-command" \
    "fix(commands): allow stop without text" \
    "src/auto-reply/reply/commands-stop.ts"

# 5.5 Heartbeat Stabilization
create_feature_branch "fix/heartbeat-stabilization" \
    "fix(gateway): stabilize heartbeat and lane management" \
    "src/auto-reply/heartbeat.ts" \
    "src/agents/agent-lane.ts"

# --- 6. Authentication ---

# 6.1 Auth Profile Cooldowns
create_feature_branch "feat/auth-profile-cooldowns" \
    "feat(auth): add profile cooldown management and force clear" \
    "src/agents/auth-profiles/usage.ts"

# 6.2 Trusted Proxy Auth
create_feature_branch "feat/trusted-proxy-auth" \
    "feat(auth): add trusted-proxy authentication mode" \
    "src/gateway/auth.ts" \
    "src/gateway/server-runtime-config.ts" \
    "docs/gateway/trusted-proxy-auth.md"

# --- 8. Skills ---

# 8.1 Upstream Sync Skill
create_feature_branch "feat/skill-upstream-sync" \
    "feat(skills): add upstream-sync skill" \
    "skills/upstream-sync/"

# 8.2 Skill Creator Enhancements
create_feature_branch "feat/skill-creator-updates" \
    "feat(skills): enhance skill creator scripts" \
    "skills/skill-creator/"

# --- 9. Plugins ---

# 9.1 Plugin Config Updates
create_feature_branch "chore/plugin-config-updates" \
    "chore(plugins): update plugin configurations and branding" \
    "extensions/*/moltbot.plugin.json"

# --- 12. Config & Defaults ---

# 12.1 Model Override Persistence (/new)
create_feature_branch "fix/model-override-persistence" \
    "fix(session): make /new sticky for model overrides" \
    "src/auto-reply/reply/session.ts"

# 12.2 Billing Error Handling
create_feature_branch "fix/billing-error-handling" \
    "fix(billing): treat membership 402 as billing error" \
    "src/config/types.auth.ts" \
    "src/config/schema.help.ts"

# --- Documentation ---
create_feature_branch "docs/general-updates" \
    "docs: update telegram, configuration, and sync documentation" \
    "docs/channels/telegram.md" \
    "docs/tools/slash-commands.md" \
    "docs/gateway/configuration-reference.md" \
    "docs/zh-CN/gateway/configuration.md"

echo "--------------------------------------------------"
echo "Done. All feature branches have been reconstructed and pushed."
