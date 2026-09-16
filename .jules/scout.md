## 2024-04-12 - [Sessions A2A] Pattern
**Defect Pattern:** The `sessions_send` announce step is missing a `transcriptMessage` when it wakes the target agent.
**Local Impact:** Target agent cannot accurately determine the source of the message because the transcript is empty. It incorrectly assumes messages are direct instead of relayed.
**Review Strategy:** Check for empty transcripts in `sessions_send` and cross-agent communication tools. Check `runAgentStep` function signatures.
