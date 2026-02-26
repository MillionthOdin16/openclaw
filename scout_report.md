# 🦅 Scout: Critical Inherited Defect Report - 2026-02-26

## 1. Upstream #26207: Telegram plugin breaks global HTTP proxy
* **Location in our code:** `src/telegram/fetch.ts` lines ~48-52
* **Observed Behavior:** The function calls `setGlobalDispatcher(new Agent(...))`, which replaces the global `undici` dispatcher for the entire Node.js process. This ignores any `HTTP_PROXY` / `HTTPS_PROXY` environment variables set for other connections, breaking outbound connectivity for users behind firewalls (e.g., GFW).
* **Expected Behavior:** The Telegram plugin should use a scoped dispatcher or `EnvHttpProxyAgent` to respect proxy settings, without mutating global state that affects other plugins/core.
* **Impact Severity:** **Critical** (breaks network connectivity for proxy users).

## 2. Upstream #27570: normalizeToolParameters fails on array inputs (Gemini)
* **Location in our code:** `src/agents/pi-tools.schema.ts` lines ~72-76
* **Observed Behavior:** `normalizeToolParameters` checks `typeof tool.parameters === "object"`, which allows arrays to pass through (as `typeof [] === 'object'`). It then returns the tool unmodified if it doesn't find schema keywords. Gemini (Google) models reject tools with array parameters with a 400 error.
* **Expected Behavior:** The function should explicitly check `Array.isArray()` and convert array-style parameters into a valid JSON Schema object (with `type: "object"` and `properties`) before passing them to the model.
* **Impact Severity:** **High** (breaks functionality for Gemini users with specific plugins).

## 3. Upstream #27565: WhatsApp allowFrom Brazilian normalization failure
* **Location in our code:** `src/utils.ts` (`normalizeE164`) and `src/whatsapp/resolve-outbound-target.ts`
* **Observed Behavior:** `normalizeE164` only strips non-digits. It does not handle the Brazilian 9th digit logic (where `+55 11 9xxxx-xxxx` and `+55 11 xxxx-xxxx` are the same number). If `allowFrom` contains one format and the incoming message uses the other, the message is blocked.
* **Expected Behavior:** The normalization logic should canonicalize Brazilian mobile numbers (e.g., always add or always remove the 9th digit) so that `allowFrom` matching works regardless of the input format.
* **Impact Severity:** **High** (blocks legitimate users in Brazil).
