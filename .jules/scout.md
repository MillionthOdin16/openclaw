# Scout's Journal - Defect Learnings

## 2024-05-22 - Initialization
**Defect Pattern:** Initialization
**Local Impact:** None yet.
**Review Strategy:** Check for high severity bugs.

## 2024-05-22 - Browser Profile Bug
**Defect Pattern:** Browser profile selection logic
**Local Impact:** `openclaw browser start --profile=chrome` fails due to circular dependency.
**Review Strategy:** Check `src/browser/profiles.ts` for logic issues.

## 2024-05-22 - Overflow Compaction Bug
**Defect Pattern:** Overflow compaction logic in `runEmbeddedPiAgent`
**Local Impact:** `runEmbeddedPiAgent` may loop indefinitely or fail to compact correctly.
**Review Strategy:** Check `src/agents/pi-embedded-runner/run.ts` for loop logic.

## 2024-05-22 - Telegram Network Bug
**Defect Pattern:** Telegram network configuration
**Local Impact:** `setGlobalDispatcher` affects all outbound requests, breaking proxy settings.
**Review Strategy:** Check `src/telegram/fetch.ts` for global dispatcher usage.

## 2024-05-22 - Sandbox Write Bug
**Defect Pattern:** Sandbox write tool logic
**Local Impact:** `write` tool fails to create directories in sandbox.
**Review Strategy:** Check `src/tools/fs.ts` or similar for sandbox checks.
