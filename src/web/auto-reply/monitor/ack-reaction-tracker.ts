/**
 * Tracks which messages have already received ack reactions.
 * Prevents duplicate reactions in broadcast scenarios.
 */
export interface AckReactionTracker {
  /** Check if a message has already received an ack reaction */
  has(chatId: string, messageId: string): boolean;
  /** Mark a message as having received an ack reaction */
  mark(chatId: string, messageId: string): void;
  /** Clear the tracker (e.g., on reconnect) */
  clear(): void;
}

export function createAckReactionTracker(options: {
  maxItems?: number;
  logVerbose?: typeof console.log;
}): AckReactionTracker {
  const maxItems = options.maxItems ?? 500;
  const logVerbose = options.logVerbose ?? (() => {});

  // Use a Map to track insertion order for LRU eviction
  const tracked = new Map<string, boolean>();

  const createKey = (chatId: string, messageId: string): string => {
    return `${chatId}:${messageId}`;
  };

  return {
    has(chatId: string, messageId: string): boolean {
      return tracked.has(createKey(chatId, messageId));
    },

    mark(chatId: string, messageId: string): void {
      const key = createKey(chatId, messageId);
      if (tracked.has(key)) {
        logVerbose(`Ack reaction already tracked for message ${messageId} in chat ${chatId}`);
        return;
      }

      tracked.set(key, true);

      // Evict oldest entry if we exceed max items
      if (tracked.size > maxItems) {
        const firstKey = tracked.keys().next().value;
        if (firstKey) {
          tracked.delete(firstKey);
          logVerbose(`Evicted oldest ack reaction tracking entry: ${firstKey}`);
        }
      }
    },

    clear(): void {
      tracked.clear();
      logVerbose("Cleared ack reaction tracker");
    },
  };
}
