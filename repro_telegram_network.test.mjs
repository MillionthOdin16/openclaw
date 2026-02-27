// Reproduction script for Telegram Network Bug using Node's test runner
import assert from "node:assert";
import { describe, it } from "node:test";
import { Agent, getGlobalDispatcher, setGlobalDispatcher } from "undici";

// Mock the problematic logic from src/telegram/fetch.ts directly
// since we can't easily import the internal TS file without compilation.
function simulateBuggyTelegramLogic(autoSelectFamily) {
  const autoSelectDecision = { value: autoSelectFamily };
  const appliedGlobalDispatcherAutoSelectFamily = null;

  if (
    autoSelectDecision.value !== null &&
    autoSelectDecision.value !== appliedGlobalDispatcherAutoSelectFamily
  ) {
    // The bug: Blindly sets a new Agent as the global dispatcher
    // ignoring any pre-existing dispatcher (e.g., proxy agent).
    setGlobalDispatcher(
      new Agent({
        connect: {
          autoSelectFamily: autoSelectDecision.value,
          autoSelectFamilyAttemptTimeout: 300,
        },
      }),
    );
  }
}

// 1. Simulate a proxy configuration (User sets this up via undici)
const proxyAgent = new Agent({
  connect: { timeout: 5000 }, // Simulate proxy properties
});
setGlobalDispatcher(proxyAgent);

// Verify initial state
const initialDispatcher = getGlobalDispatcher();
assert.strictEqual(
  initialDispatcher,
  proxyAgent,
  "Initial dispatcher should be the proxy agent",
);

// 2. Call the problematic function with autoSelectFamily=true
simulateBuggyTelegramLogic(true);

// 3. Assert that the global dispatcher has changed (proxy lost)
const currentDispatcher = getGlobalDispatcher();
assert.notStrictEqual(
  currentDispatcher,
  proxyAgent,
  "Global dispatcher was overwritten (Proxy settings lost!)",
);

console.log("Bug Confirmed: Global dispatcher was overwritten.");
