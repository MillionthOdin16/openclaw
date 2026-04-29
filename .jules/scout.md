## 2026-04-29 - Memory Manager QMD Collection Registration Bug
**Defect Pattern:** The `qmd` collection logic registers collections under a different name if there is already a collection at that path/pattern. Or the name conflicts and triggers a failure. The collection name mismatch causes memory search failures on boot because `qmd` collection was registered under a legacy name (like `life-main`) instead of `life`.
**Local Impact:** This bug causes boot failure where memory searches fail with `Collection not found`.
**Review Strategy:** `src/memory/qmd-manager.ts` needs to be reviewed to ensure collection name mismatches are handled properly on boot.

## 2026-04-29 - Memory Vector Search Broken (SQLite ABI mismatch)
**Defect Pattern:** `sqlite-vec` binary fails to load properly with Node due to ABI mismatch. It requires SQLite 3.45.x but OpenClaw bindings load it with SQLite 3.51.x, which causes `chunks_vec` to not be updated and memory vector search degraded.
**Local Impact:** Vector search completely degraded and falls back to FTS keyword search.
**Review Strategy:** `package.json` needs to be reviewed to update `sqlite-vec` to `v0.1.9` and verify ABI compatibility, or update bindings.
