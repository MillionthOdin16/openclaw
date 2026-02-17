# Scout's Journal

## 2026-02-18 - MSTeams Channel Context Loss

**Defect Pattern:** Data Loss in Conversation Reference Reconstruction
**Local Impact:** When reconstructing conversation references for MS Teams channel messages, critical context fields like `teamId` are silently dropped, causing `continueConversation` to fail or route incorrectly for channel replies.
**Review Strategy:** Check all adapter implementations for proper serialization/deserialization of context objects, specifically ensuring that fields required for channel context (like `teamId` or `channelData`) are preserved.
