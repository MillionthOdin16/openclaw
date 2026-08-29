## 2026-08-27 - Process Module Pattern
**Defect Pattern:** We frequently inherit severe logic errors involving child process management (unreaped zombies leading to spawn EAGAIN).
**Local Impact:** Long-running Gateway services and connectors (e.g. Slack, Telegram) degrade and crash because zombie tool/hook processes exhaust OS thread limits.
**Review Strategy:** Double-check all usages of `spawn`, `execFile`, and `exec` in `src/process/` for missing waitpid/exit handlers.
