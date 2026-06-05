## 2026-06-05 - skills Pattern

**Defect Pattern:** Chokidar file watcher targeting specific files instead of directories holds persistent read-only file descriptors.
**Local Impact:** Causes linear FD exhaustion (one FD per user skill) on our fork, eventually crashing the gateway process.
**Review Strategy:** Review any new Chokidar watch targets in the skills or gateway module to ensure we watch directories rather than individual files, or ensure FD lifecycle is properly bounded.
