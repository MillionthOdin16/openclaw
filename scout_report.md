# 🦅 Scout: Critical Inherited Defect Report - 2025-05-15

## Summary of Legitimate Bugs

### **Upstream Issue #14143: Memory compaction never triggers (compactionCount: 0)**
* **Location in our code:** `src/agents/pi-embedded-runner/run.ts` lines 600-630 (inside `runEmbeddedPiAgent` loop)
* **Observed Behavior:**
    When `runEmbeddedPiAgent` triggers auto-compaction due to context overflow (calling `compactEmbeddedPiSessionDirect`), it successfully compacts the session file but **fails to emit** `compaction` stream events (`phase: "end"`).
    As a result, the parent runner (`runReplyAgent`) does not detect the compaction completion and fails to call `incrementRunCompactionCount`.
    Because `compactionCount` remains `0` in the session store, the `runMemoryFlushIfNeeded` logic (which checks `lastFlushAt !== compactionCount`) erroneously assumes it has already flushed for the current state, preventing any future memory flushes.
* **Expected Behavior:**
    `runEmbeddedPiAgent` must emit `stream: "compaction", data: { phase: "end" }` upon successful auto-compaction. This ensures `compactionCount` increments in the session store, allowing `runMemoryFlushIfNeeded` to recognize a new compaction cycle and trigger subsequent flushes.
* **Impact Severity:** **Critical**.
    Long-running sessions effectively stop persisting memories to disk after the initial flush (at ~4k tokens). If the session crashes or is reset after days of usage, all durable memories formed after the first few minutes are lost.

---
*Scan complete.*
