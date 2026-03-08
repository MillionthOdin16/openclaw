# 🦅 Scout: Critical Inherited Defect Report - 2024-05-24

**Upstream Issue:** https://github.com/openclaw/openclaw/issues/26792
**Local File Path & Line Numbers:**
- `src/memory/manager-sync-ops.ts` lines 642-645, 723-726
- `src/memory/manager-embedding-ops.ts` lines 698-703
**Observed Behavior:**
FTS-only mode (no embedding provider configured) returns early, skipping file scanning and chunking entirely due to `if (!this.provider) return;` checks. This results in the FTS index remaining empty with 0 files and 0 chunks, meaning keyword search will return no results.
**Expected Behavior:**
FTS-only mode should index memory files into the FTS table (chunking + full-text insertion) without relying on vector embeddings. Keyword search should work and `openclaw memory search` should return relevant matching content without requiring an embedding provider.
**Impact Severity:** High. It breaks the fallback search mode for users without embedding provider API keys configured, rendering FTS effectively useless despite the status reporting "FTS: ready".
