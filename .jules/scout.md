## 2025-05-20 - Transcript Repair Pattern

**Defect Pattern:** Cross-provider failover creates phantom toolResult with empty toolCallId, permanently corrupting session
**Local Impact:** When a fallback model signals `stopReason: "toolUse"` but provides no actual `toolCall` blocks (only thinking or text), OpenClaw's transcript repair (`repairToolUseResultPairing` in `src/agents/session-transcript-repair.ts`) incorrectly preserves the `stopReason: "toolUse"` and fails to generate valid tool calls. Additionally, the missing ID check (`!toolCallId || toolCallId.trim() === ''`) is missing during transcript sanitization or synthetic tool result generation, leading to empty toolResult blocks (`toolCallId: "", toolName: ""`).
**Review Strategy:** Check `src/agents/session-transcript-repair.ts` (specifically `repairToolUseResultPairing`), and check if `stopReason` is validated against actual `toolCalls.length`.

## 2025-05-20 - Cron Payload Model Override Pattern

**Defect Pattern:** Cron payload model override ignored - LiveSessionModelSwitchError
**Local Impact:** When a cron job triggers with a payload model that overrides the agent's default model, it's immediately aborted by `LiveSessionModelSwitchError` instead of respecting the override.
**Review Strategy:** Check `resolvePersistedLiveSelection()` for any LiveSessionModelSwitchError throws that fail to check if a run was triggered by cron or has a payload model override.

## 2025-05-20 - Fallback Chain Death Loop Pattern

**Defect Pattern:** LiveSessionModelSwitchError defeats fallback chain during provider outages
**Local Impact:** When falling back to a last-resort model, the gateway erroneously throws `LiveSessionModelSwitchError` to switch back to the primary model (which is down), creating an infinite loop.
**Review Strategy:** Check the logic around `LiveSessionModelSwitchError` to ensure it's suppressed when failing over to a fallback model.
