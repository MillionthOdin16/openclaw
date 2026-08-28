## 2024-08-28 - Subagent Registry / Sandbox Pattern
**Defect Pattern:** Unhandled rejections in detached background tasks and large payload strings in `exec` calls causing fatal process exits and OOM crashes.
**Local Impact:** The OpenClaw gateway is vulnerable to process crashes when subagent lifecycle background completion fails or when the sandbox FS bridge attempts to write massive buffers. Both paths can take down the core agent loop.
**Review Strategy:** Check for floating promises (missing `.catch`) in asynchronous timer callbacks (e.g., `setTimeout`) and validate buffer sizes when piping data into child process inputs.
