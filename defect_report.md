# 🦅 Scout: Critical Inherited Defect Report - 2024-05-22

## Summary of Legitimate Bugs

### 1. Upstream Issue #28687: Browser profile selection bug
* **Location in our code:** `src/browser/config.ts` lines 2816-2852
* **Observed Behavior:** The function `ensureDefaultChromeExtensionProfile` unconditionally creates a `chrome` profile with `driver: "extension"`. Since `resolveDefaultProfile` prioritizes `chrome` if it exists, users are forced into extension mode even if they intended to use `openclaw` profile, causing connection errors when no extension is attached.
* **Expected Behavior:** The browser should respect the `defaultProfile` setting if provided, or prioritize the `openclaw` profile (CDP mode) over the auto-created `chrome` extension profile unless explicitly requested.
* **Impact Severity:** **High**. Blocks core browser functionality for users expecting standard CDP control.

### 2. Upstream Issue #26207: Telegram `setGlobalDispatcher` breaks proxy settings
* **Location in our code:** `src/telegram/fetch.ts` lines 1151 (approx)
* **Observed Behavior:** The `applyTelegramNetworkWorkarounds` function calls `setGlobalDispatcher(new Agent(...))` to fix IPv6 issues. This overwrites any existing global dispatcher (e.g., a proxy agent configured for `undici`), breaking outbound connectivity for all other providers/tools that rely on the global dispatcher.
* **Expected Behavior:** The workaround should check for an existing dispatcher or use a scoped dispatcher for Telegram requests only, preserving the global proxy configuration.
* **Impact Severity:** **Critical**. Breaks all external connectivity (LLM APIs, tools) for users behind proxies/VPNs.

## Scan Complete
Scan complete. 2 core-breaking OpenClaw upstream defects found in our local codebase.
