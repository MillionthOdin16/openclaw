1. **Analyze logs & identify defects:** I have successfully collected data from the upstream `openclaw/openclaw` repository and identified matching logic flaws in our local codebase.
2. **Defect 1: Unclosed `fs.FileHandle` in `session-write-lock.ts`**: The `acquireSessionWriteLock` function opens a `fs.FileHandle` to write a lock file, but has exit paths where it can be left open (e.g. timeout on wait). Wait, I only need to report them in this task, not fix them.
3. **Defect 2: Missing clear handlers for `chokidar` in `refresh.ts`**: `workspaceVersions` and `watchers` maps in `src/agents/skills/refresh.ts` do not have cleanup functions, leading to memory/FD leaks when dealing with dynamic workspaces.
4. **Draft the Report**: Combine these findings into a concise report as instructed. The report must contain:
    - Title: "🦅 Scout: Critical Inherited Defect Report - 2026-06-26"
    - Upstream Issue Link/ID
    - Local File Path & Line Numbers
    - Expected vs. Observed Behavior
    - Impact Severity
5. **Output via `done` tool**: Summarize and submit. I have also correctly recorded the critical pattern in `.jules/scout.md`.
