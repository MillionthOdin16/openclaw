## 2026-08-23 - Matrix Pattern
**Defect Pattern:** Channel extension skipping reasoning messages unconditionally even when reasoning is enabled for the channel.
**Local Impact:** The Matrix channel in our fork won't deliver reasoning blocks even if the user has requested them via `/reasoning on`.
**Review Strategy:** Check `deliverMatrixReplies` in `extensions/matrix/src/matrix/monitor/replies.ts` and similar channel extensions (like Telegram or Slack) to ensure they respect reasoning visibility settings when deciding whether to drop pure-reasoning messages.
