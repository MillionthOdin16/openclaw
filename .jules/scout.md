## 2024-03-04 - Memory Synchronization Pattern
**Defect Pattern:** Memory sync retries terminal OpenAI embeddings 429 (insufficient_quota) on every sync, starving the sync queue
**Local Impact:** When the configured OpenAI embedding key has no credits left, every memory sync classifies the terminal 429 insufficient_quota response as retryable, burns 3 attempts with backoff sleeps inside the single-flight sync slot, fails, and repeats on the next sync tick forever.
**Review Strategy:** Check `src/memory/manager-embedding-ops.ts` for retry logic involving `429`.
