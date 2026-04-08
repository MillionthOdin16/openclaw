## 2026-04-05 - Gateway HTTP Routing Pattern
**Defect Pattern:** The compiled gateway bundle or hardcoded route ordering causes core middlewares (like canvasHost) to preempt and block plugin HTTP endpoints, returning 405 Method Not Allowed instead of routing to the plugin.
**Local Impact:** In `src/gateway/server-http.ts`, the `canvasHost.handleHttpRequest` is still ordered *before* `buildPluginRequestStages`, meaning any plugin HTTP route (e.g., Google Chat) will be intercepted by the canvas host if the path overlaps, causing it to fail.
**Review Strategy:** When reviewing gateway HTTP pipelines, always double-check the order of operations between core subsystems and extensible plugin hooks to prevent preemptive consumption.
