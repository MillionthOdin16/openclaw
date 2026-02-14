# 🦅 Scout: Critical Inherited Defect Report - 2026-02-14

## Summary of Legitimate Bugs

### Upstream Issue #16253: Gateway crashes on Anthropic 'sibling tool call errored' API response
* **Location in our code:** `src/agents/pi-embedded-runner/run/attempt.ts`
* **Observed Behavior:** When the Anthropic API returns a "sibling tool call errored" response (typically due to parallel tool execution failure), the gateway process crashes with SIGTERM/SIGKILL instead of handling the error gracefully.
* **Expected Behavior:** The gateway should catch this specific API error, log a warning, and allow the agent session to continue or fail gracefully without crashing the entire process.
* **Impact Severity:** **CRITICAL**. Crashes the entire gateway, causing loss of all active sessions and requiring a restart.

## Journal - Defect Learnings

## 2026-02-14 - [Agents] Pattern
**Defect Pattern:** Unhandled API errors from external providers (Anthropic) causing process crashes.
**Local Impact:** Gateway instability when using advanced models with parallel tool calling.
**Review Strategy:** Check all `streamFn` implementations and API integration points for robust error handling, especially around stream iteration and promise rejections.
