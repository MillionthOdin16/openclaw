import { shouldAckReactionForWhatsApp } from "../../../channels/ack-reactions.js";
import type { loadConfig } from "../../../config/config.js";
import { logVerbose } from "../../../globals.js";
import { sendReactionWhatsApp } from "../../outbound.js";
import { formatError } from "../../session.js";
import type { WebInboundMsg } from "../types.js";
import { resolveGroupActivationFor } from "./group-activation.js";

export function maybeSendAckReaction(params: {
  cfg: ReturnType<typeof loadConfig>;
  msg: WebInboundMsg;
  agentId: string;
  sessionKey: string;
  conversationId: string;
  verbose: boolean;
  accountId?: string;
  info: (obj: unknown, msg: string) => void;
  warn: (obj: unknown, msg: string) => void;
  ackReactionTracker?: AckReactionTracker;
}) {
  if (!params.msg.id) {
    return;
  }

  // Skip if we already sent an ack reaction for this message in broadcast scenarios
  if (params.ackReactionTracker?.has(params.msg.chatId, params.msg.id)) {
    logVerbose(
      `Skipping ack reaction: already sent for message ${params.msg.id} in chat ${params.msg.chatId}`,
    );
    return;
  }

  const ackConfig = params.cfg.channels?.whatsapp?.ackReaction;
  const emoji = (ackConfig?.emoji ?? "").trim();
  const directEnabled = ackConfig?.direct ?? true;
  const groupMode = ackConfig?.group ?? "mentions";
  const conversationIdForCheck = params.msg.conversationId ?? params.msg.from;

  const activation =
    params.msg.chatType === "group"
      ? resolveGroupActivationFor({
          cfg: params.cfg,
          agentId: params.agentId,
          sessionKey: params.sessionKey,
          conversationId: conversationIdForCheck,
        })
      : null;
  const shouldSendReaction = () =>
    shouldAckReactionForWhatsApp({
      emoji,
      isDirect: params.msg.chatType === "direct",
      isGroup: params.msg.chatType === "group",
      directEnabled,
      groupMode,
      wasMentioned: params.msg.wasMentioned === true,
      groupActivated: activation === "always",
    });

  if (!shouldSendReaction()) {
    return;
  }

  // Mark this message as having received an ack reaction before sending
  // This prevents duplicate reactions in broadcast scenarios
  params.ackReactionTracker?.mark(params.msg.chatId, params.msg.id);

  params.info(
    { chatId: params.msg.chatId, messageId: params.msg.id, emoji },
    "sending ack reaction",
  );
  sendReactionWhatsApp(params.msg.chatId, params.msg.id, emoji, {
    verbose: params.verbose,
    fromMe: false,
    participant: params.msg.senderJid,
    accountId: params.accountId,
  }).catch((err) => {
    params.warn(
      {
        error: formatError(err),
        chatId: params.msg.chatId,
        messageId: params.msg.id,
      },
      "failed to send ack reaction",
    );
    logVerbose(`WhatsApp ack reaction failed for chat ${params.msg.chatId}: ${formatError(err)}`);
  });
}
