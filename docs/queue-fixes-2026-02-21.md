# Queue System Fixes - 2026-02-21

## Issues Fixed

### 1. Drain Timeout (drain.ts)

**Problem:** Drains could run indefinitely without timeout
**Fix:** Added `DRAIN_TIMEOUT_MS = 30000` (30 seconds) max per drain cycle
**Location:** Lines 7, 76-79

```typescript
const DRAIN_TIMEOUT_MS = 30000; // 30 seconds max per drain cycle

// Check for timeout - exit drain cycle if taking too long
const elapsed = Date.now() - drainStartTime;
if (elapsed > DRAIN_TIMEOUT_MS) {
  defaultRuntime.warn?.(`followup queue drain cycle timeout (${elapsed}ms) for ${key}, pausing`);
  break;
}
```

### 2. Max Retries (drain.ts)

**Problem:** Error recovery loop could retry infinitely
**Fix:** Added `MAX_DRAIN_RETRIES = 3` before clearing queue
**Location:** Lines 6, 55-63

```typescript
const MAX_DRAIN_RETRIES = 3;

// In catch block:
(queue as any)._retryCount = retryCount + 1;
if ((queue as any)._retryCount >= MAX_DRAIN_RETRIES) {
  defaultRuntime.error?.(
    `followup queue max retries (${MAX_DRAIN_RETRIES}) exceeded for ${key}, clearing queue`,
  );
  queue.items.length = 0;
  queue.droppedCount = 0;
  queue.summaryLines = [];
  delete (queue as any)._retryCount;
}
```

### 3. Diagnostic Functions (drain.ts)

**Problem:** No visibility into queue state for debugging
**Fix:** Added `getQueueDiagnostics()` and `forceClearStuckQueue()`
**Location:** Lines 97-153

```typescript
// Get info about all queues
export function getQueueDiagnostics(): Array<{...}>

// Force clear stuck queue (draining > 60s)
export function forceClearStuckQueue(key: string, maxDrainingMs = 60000): number
```

### 4. Aggressive Cooldown Clearing (usage.ts)

**Problem:** Profiles could get "stuck" in cooldown
**Fix:** Added `forceClearCooldowns()` function
**Location:** Lines 155-186

```typescript
// Force clear cooldowns even if not expired
export function forceClearCooldowns(store: AuthProfileStore, profileIds?: string[]): number;
```

## Files Modified

1. **src/auto-reply/reply/queue/drain.ts**
   - Added timeout constant and tracking
   - Added retry count tracking
   - Added timeout check in drain loop
   - Added max retries logic
   - Added diagnostic functions

2. **src/agents/auth-profiles/usage.ts**
   - Added `forceClearCooldowns()` function

3. **src/auto-reply/reply/queue/drain.fixes.test.ts** (NEW)
   - Tests for timeout behavior
   - Tests for max retries
   - Tests for diagnostic functions
   - Tests for force clear

## Usage

### Diagnose stuck queues

```typescript
import { getQueueDiagnostics } from "./queue/drain.js";

const diagnostics = getQueueDiagnostics();
for (const diag of diagnostics) {
  console.log(
    `${diag.key}: ${diag.depth} items, draining=${diag.draining}, retries=${diag.retryCount}`,
  );
}
```

### Force clear stuck queue

```typescript
import { forceClearStuckQueue } from "./queue/drain.js";

// Clear queue stuck draining > 60s
const cleared = forceClearStuckQueue("session-key", 60000);
console.log(`Cleared ${cleared} stuck items`);
```

### Force clear stuck profiles

```typescript
import { forceClearCooldowns } from "../agents/auth-profiles/usage.js";

// Clear all profiles
const cleared = forceClearCooldowns(store);

// Clear specific profiles
const cleared = forceClearCooldowns(store, ["openai:gpt-4", "anthropic:claude-3"]);
```

## Prevention

These fixes prevent:

- ✅ Infinite drain loops
- ✅ Messages stuck in queue forever
- ✅ Profiles permanently stuck in cooldown
- ✅ No visibility into queue state

## Monitoring

Recommended monitoring:

- Log when `DRAIN_TIMEOUT_MS` exceeded
- Log when `MAX_DRAIN_RETRIES` exceeded
- Alert if queue depth > 10 consistently
- Alert if draining > 60s

## Testing

Run tests:

```bash
pnpm test src/auto-reply/reply/queue/drain.fixes.test.ts
```

---

**Date:** 2026-02-21
**Author:** Badger-1 (SOTA improvement session)
**Issue:** Queue messages getting stuck
**Resolution:** Added timeouts, max retries, diagnostics, and force clear functions
