## 2024-05-24 - Unhandled JSON Parsing Rejections in Gateway Plugin

**Vulnerability:** Calling `.json()` on a fetch response without checking `response.ok` leads to unhandled errors when the API returns an error status (like 503) or non-JSON content, crashing the gateway.
**Learning:** The gateway plugin fetch in `src/discord/monitor/gateway-plugin.ts` did not validate `response.ok`. This allowed non-JSON 503 responses to throw JSON parsing errors that obfuscate the actual API error, leading to instability or unhandled rejections during Gateway metadata lookups.
**Prevention:** Always check `response.ok` before attempting to parse JSON, and explicitly handle the text fallback for error reporting.
