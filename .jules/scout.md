## 2024-05-24 - OpenAI Completions Stream Logic Pattern
**Defect Pattern:** The direct stream provider snapshots the first streamed function name block and refuses to update it on subsequent deltas that include valid function name chunks.
**Local Impact:** This could lead to partial tool names being finalized instead of full names if we have the same bug.
**Review Strategy:** Check the `streamOpenAICompletions` implementation or equivalent in `packages/ai/src/providers/openai-completions.ts` to ensure `block.name` is replaced by non-empty `delta.name` chunks.
## 2024-05-24 - ACP Session Key Identity Loss Pattern
**Defect Pattern:** When ACP resolves an existing agent-qualified session key (e.g. `agent:ops:main` to `global`), the `sessions.resolve` endpoint returns `{ key: "global", agentId: "ops" }`. However, `src/acp/session-mapper.ts` only extracts `.key` from this tuple, discarding `.agentId`.
**Local Impact:** This triggers failures when multiple agents are configured, as subsequent operations receive just `global` and reject it as an ambiguous ownerless key.
**Review Strategy:** Check `src/acp/session-mapper.ts` (specifically `resolveSessionKey` and `AcpSessionMeta`) and downstream gateway requests to ensure they carry and supply both `key` and `agentId`.
## 2024-05-24 - Focus Subagent Identity Loss Pattern
**Defect Pattern:** The `/focus` subagent resolver discards `sessions.resolve.agentId` and instead tries to parse the resolved `key`. If the canonical key has no agent prefix (e.g. `global`), it falls back to a hard-coded `main` agent.
**Local Impact:** `action-focus.ts` binds `main` to a shared row explicitly owned by another agent, breaking focus initialization.
**Review Strategy:** Check `src/commands/sessions.ts` (specifically the call to `parseAgentSessionKey(row.key)?.agentId ?? target.agentId`) and any shared subagent logic that relies on `.key` rather than `.agentId`.
## 2024-05-24 - Unbounded Media Text Amplification
**Defect Pattern:** Media understanding (e.g., audio/OCR) provider results lack a hard text character/byte admission ceiling. `maxChars` can be arbitrary, or unset, and formatters concatenate these boundless inputs without an aggregate budget, resulting in massive context inflation and unbounded transcript generation.
**Local Impact:** Can easily exceed model-context policies or cause OOMs if processing long audio files.
**Review Strategy:** Check `src/media-understanding/runner.entries.ts` and related formatters/trim methods for hard limits on text outputs.
