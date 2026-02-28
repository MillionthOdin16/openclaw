## 2024-05-24 - [Replace eval() with new Function()]

**Vulnerability:** Use of `eval()` in Playwright browser-context evaluation functions (`src/browser/pw-tools-core.interactions.ts`).
**Learning:** `eval()` executes code in the current scope, which can inadvertently access or modify local variables and closures, potentially leading to unintended side effects or security risks if user-provided code is executed. It was used here for dynamic execution of code sent by the AI model. Replacing it with `new Function()` is the project's preferred remediation for dynamic code execution requirements.
**Prevention:** Avoid `eval()` entirely. If dynamic code execution is required, use `new Function()` and suppress the lint warning with `// eslint-disable-next-line @typescript-eslint/no-implied-eval` after ensuring the usage is necessary and secure. `new Function()` is safer because it executes in the global scope, isolating the execution context from local variables.
