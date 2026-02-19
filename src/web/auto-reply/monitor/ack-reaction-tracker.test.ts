import { describe, expect, it } from "vitest";
import { createAckReactionTracker } from "./ack-reaction-tracker.js";

describe("AckReactionTracker", () => {
  it("marks and checks ack reactions", () => {
    const tracker = createAckReactionTracker({ maxItems: 100 });

    expect(tracker.has("chat1", "msg1")).toBe(false);

    tracker.mark("chat1", "msg1");
    expect(tracker.has("chat1", "msg1")).toBe(true);

    // Different message should not be marked
    expect(tracker.has("chat1", "msg2")).toBe(false);

    // Same message ID but different chat should not be marked
    expect(tracker.has("chat2", "msg1")).toBe(false);
  });

  it("prevents duplicate ack reactions", () => {
    const tracker = createAckReactionTracker({ maxItems: 100 });

    tracker.mark("chat1", "msg1");
    tracker.mark("chat1", "msg1"); // Second call should be no-op

    expect(tracker.has("chat1", "msg1")).toBe(true);
  });

  it("evicts oldest entries when max items exceeded", () => {
    const tracker = createAckReactionTracker({ maxItems: 3 });

    tracker.mark("chat1", "msg1");
    tracker.mark("chat1", "msg2");
    tracker.mark("chat1", "msg3");

    expect(tracker.has("chat1", "msg1")).toBe(true);
    expect(tracker.has("chat1", "msg2")).toBe(true);
    expect(tracker.has("chat1", "msg3")).toBe(true);

    // Adding a 4th item should evict the 1st
    tracker.mark("chat1", "msg4");

    expect(tracker.has("chat1", "msg1")).toBe(false); // Evicted
    expect(tracker.has("chat1", "msg2")).toBe(true);
    expect(tracker.has("chat1", "msg3")).toBe(true);
    expect(tracker.has("chat1", "msg4")).toBe(true);
  });

  it("clears all tracked entries", () => {
    const tracker = createAckReactionTracker({ maxItems: 100 });

    tracker.mark("chat1", "msg1");
    tracker.mark("chat1", "msg2");

    expect(tracker.has("chat1", "msg1")).toBe(true);
    expect(tracker.has("chat1", "msg2")).toBe(true);

    tracker.clear();

    expect(tracker.has("chat1", "msg1")).toBe(false);
    expect(tracker.has("chat1", "msg2")).toBe(false);
  });
});
