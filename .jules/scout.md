## 2026-02-28 - Embedded Agent Compaction Pattern
**Defect Pattern:** Desynchronized event emission during fallback/overflow compaction flows.
**Local Impact:** Auto-reply memory flush logic is broken because `compactionCount` parity is lost when stream events are omitted during explicit overflow auto-compaction.
**Review Strategy:** Double-check event emission parity in `src/agents/pi-embedded-runner/run.ts` whenever introducing new retry or fallback loops.

## 2026-02-28 - WhatsApp E164 Normalization Pattern
**Defect Pattern:** Missing regional digit support in number normalization.
**Local Impact:** Total authentication failure for Brazilian WhatsApp numbers due to strict `allowFrom` matching breaking on the 9th digit.
**Review Strategy:** Verify regional phone number handling in `src/utils.ts` `normalizeE164`.
