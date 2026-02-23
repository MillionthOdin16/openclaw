## 2026-02-24 - Agent Execution Pattern
**Defect Pattern:** Concurrency race conditions in message queueing during active tool execution.
**Local Impact:** Our `queueEmbeddedPiMessage` implementation in `src/agents/pi-embedded-runner/runs.ts` relies on `isStreaming` check which is insufficient to distinguish between text streaming (safe to interrupt) and tool execution (unsafe to interrupt). This leads to "Message ordering conflict" when users send messages while tools are running.
**Review Strategy:** Check all queue/steer logic for awareness of `isExecutingTools` state. Verify that `EmbeddedPiQueueHandle` implementations expose this state correctly.
