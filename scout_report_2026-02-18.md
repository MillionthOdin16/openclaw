# 🦅 Scout: Critical Inherited Defect Report - 2026-02-18

## Summary of Legitimate Bugs

### 1. Upstream Issue #2364: session-memory hook hardcodes Anthropic provider
* **Location in our code:** `src/hooks/llm-slug-generator.ts`
* **Observed Behavior:** The function `generateSlugViaLLM` calls `runEmbeddedPiAgent` without specifying a provider or model. This causes `runEmbeddedPiAgent` to default to `DEFAULT_PROVIDER` ("anthropic") and `DEFAULT_MODEL`.
* **Expected Behavior:** The function should use the configured model provider from `cfg.agents.defaults.model` (or specific agent config), and correctly parse "provider/model" strings.
* **Impact Severity:** High (Usability). Users who do not have an Anthropic API key but have configured another provider (e.g. OpenAI) will experience failures in the `session-memory` hook, causing errors in session slug generation.

## Action Taken
I have implemented a fix in `src/hooks/llm-slug-generator.ts` to correctly resolve and use the configured model provider.
