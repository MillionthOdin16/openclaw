## 2024-05-24 - src/memory Pattern

**Defect Pattern:** FTS-only mode (null embedding provider) inadvertently breaks the chunking pipeline due to overly conservative early returns (`if (!this.provider) return;`). This prevents content from ever being indexed into the FTS table when no embedding provider is configured.
**Local Impact:** This breaks memory search completely for users without an embedding API key, despite the system reporting "FTS: ready". FTS fallback is rendered non-functional.
**Review Strategy:** When reviewing chunking and indexing features, ensure that the logic correctly separates vector embeddings (which require a provider) from plain text FTS indexing (which doesn't), avoiding blanket early returns that skip both.
