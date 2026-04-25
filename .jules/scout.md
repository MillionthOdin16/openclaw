## 2026-04-25 - Gateway Session Store Pattern
**Defect Pattern:** OOM crashes due to `loadCombinedSessionStoreForGateway` loading all agent sessions into memory simultaneously instead of lazy-loading or paginating.
**Local Impact:** Gateway crashes when running with multiple agents and a large number of accumulated sessions, especially during hook dispatch.
**Review Strategy:** Check for any calls to `loadCombinedSessionStoreForGateway` and ensure they are either lazy-loaded or not loading the entire store indiscriminately.
