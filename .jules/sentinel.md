## 2025-03-08 - Added Command Injection Protection Rule to Skill Scanner

**Vulnerability:**
The `skill-scanner.ts` utility (used to scan plugin/skill code for vulnerabilities) checks for dangerous functions from `child_process` (like `exec`, `spawn`, `execSync`). However, it didn't check for direct global usage of `Bun.spawn`, `Bun.spawnSync`, `Deno.run`, or `Deno.Command`, which allows plugins to execute shell commands if run in those alternative runtimes, bypassing the node `child_process` check entirely.

**Learning:**
Security scanners that rely on detecting module imports (`child_process`) can easily be bypassed in cross-runtime environments (like Bun or Deno) where process execution APIs are provided as globals (e.g., `Bun.spawn()`). This repo's plugin ecosystem could be run under alternative runtimes.

**Prevention:**
Added a regex rule for alternative runtime global execution patterns (`Bun.spawn`, `Bun.spawnSync`, `Deno.run`, `Deno.Command`). When scanning for dangerous code execution, ensure that both Node.js standard library approaches and alternative runtime globals are covered.
