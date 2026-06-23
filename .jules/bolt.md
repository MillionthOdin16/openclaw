## 2026-03-09 - Chokidar FD Leak Pattern

**Learning:** The OpenClaw project exhibits a 'Chokidar FD Leak Pattern' defect (e.g., in `src/agents/skills/refresh.ts`) where the Chokidar file watcher targeting specific files (like `SKILL.md`) holds persistent read-only file descriptors, causing linear FD exhaustion on large directories.
**Action:** Watch targets should use directories rather than individual files (or file globs) to bound the number of file descriptors used, using Chokidar's `depth` and `ignored` options to filter effectively.
