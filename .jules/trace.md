## 2024-05-18 - File Lock Unit Tests
**Learning:** Testing concurrent file locking and timeout mechanisms requires simulating external processes. Using a temp directory and creating lock files directly simulates cross-process stale locks efficiently.
**Action:** Created dedicated test suite for file-lock.ts validating reentrancy, stale lock cleanup, and proper cleanup on errors.
