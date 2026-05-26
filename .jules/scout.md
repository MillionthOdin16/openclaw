## 2026-05-22 - Slack Accounts Pattern
**Defect Pattern:** Slack accounts: dmPolicy "open" ignored in authorizeSlackDirectMessage, DMs silently dropped
**Local Impact:** When dmPolicy is set to "open", the direct messages are silently dropped instead of being allowed.
**Review Strategy:** Check the `authorizeSlackDirectMessage` function in `src/slack/monitor/dm-auth.ts` and ensure it handles the 'open' dmPolicy correctly.

## 2026-05-22 - Session Transcript Pattern
**Defect Pattern:** OpenClaw can persist `tool.call` without a matching `tool.result` when a Codex turn is denied, interrupted, or terminated
**Local Impact:** When a Codex turn is denied, interrupted, or terminated, the `tool.call` is persisted without a matching `tool.result`, which can cause errors when the session is resumed.
**Review Strategy:** Check the session transcript repair mechanisms to ensure it properly handles missing tool results when a Codex turn is denied, interrupted, or terminated.
