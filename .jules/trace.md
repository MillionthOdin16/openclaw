## 2026-03-09 - Improving Spawn Utils Coverage

**Learning:** When dealing with asynchronous process spawning utilities that handle complex fallbacks and race conditions (like double 'error' or 'spawn' emissions from underlying mechanisms like node-pty or child_process), it's crucial to write tests that mock these mechanisms deterministically using simple `EventEmitter` objects.

**Action:** Added extensive test coverage for `spawn-utils.ts` by creating deterministic `EventEmitter` stubs representing `ChildProcess` instances. We tested multi-error early return paths, fallback exhaustion loops, and added `/* v8 ignore */` markers for truly unreachable edge cases (e.g. `throw lastError` when the attempts array can never be empty by construction), boosting coverage from ~67% to over 96%.
