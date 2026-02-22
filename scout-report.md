# 🦅 Scout: Critical Inherited Defect Report - 2025-02-20

## Summary of Legitimate Bugs

### **Upstream Issue #13603: Custom provider (vLLM/Qwen) responses silently dropped — assistant messages never routed to webchat**
* **Location in our code:** `src/agents/pi-embedded-runner/run/attempt.ts` lines 636-640 (usage of `streamSimple`)
* **Observed Behavior:** When connected to a vLLM/Qwen provider, the assistant generates a response (confirmed via vLLM logs), but the OpenClaw gateway drops the message content. This is caused by `streamSimple` (from `@mariozechner/pi-ai`) failing to parse responses containing empty `tool_calls: []` arrays or `reasoning_content: null` fields, which are common in vLLM outputs. The session hangs until timeout or user intervention.
* **Expected Behavior:** The stream parser should strictly ignore `tool_calls` if the array is empty and gracefully handle or ignore non-standard fields like `reasoning_content` without dropping the main `content`.
* **Impact Severity:** **Critical**. It renders the system unusable with custom OpenAI-compatible providers (a core feature), causing data loss (assistant response is lost) and session stalls.

Scan complete. One core-breaking OpenClaw upstream defect found in our local codebase.
