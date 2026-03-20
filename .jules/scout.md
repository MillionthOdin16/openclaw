## 2026-03-20 - Discord Monitor Pattern
**Defect Pattern:** Un-awaited .json() parsing on fetch responses allows non-JSON errors (like 503s) to bypass try/catch blocks, causing unhandled promise rejections that crash the gateway process.
**Local Impact:** Can cause gateway crashes affecting all agents when Discord API goes down.
**Review Strategy:** Double-check fetch response handling and JSON parsing in gateway plugins and health monitors.
## 2026-03-20 - Streaming Layer Pattern
**Defect Pattern:** Unhandled API parameter errors in underlying pi-ai streaming library lead to gateway process crashes rather than graceful error returns.
**Local Impact:** Can cause gateway crashes during message processing when model configurations are missing or unsupported.
**Review Strategy:** Check agent-loop error handling around streaming requests and model API options mapping.
## 2026-03-20 - Chokidar Pattern
**Defect Pattern:** Unbounded recursive file watching via chokidar without depth limits causes FD exhaustion.
**Local Impact:** When workspaces have many session files or deep directories, gateway chokes and fails to spawn child processes (e.g., executing commands).
**Review Strategy:** Check all chokidar.watch initializations for appropriate depth limits and ignored directories.
