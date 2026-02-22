import type { UsageProviderId } from "../../infra/provider-usage.types.js";
import type { MediaUnderstandingDecision } from "../../media-understanding/types.js";
import type { ElevatedLevel, ReasoningLevel, ThinkLevel, VerboseLevel } from "../thinking.js";
import type { ReplyPayload } from "../types.js";
import type { CommandContext } from "./commands-types.js";
import {
  resolveAgentDir,
  resolveDefaultAgentId,
  resolveSessionAgentId,
} from "../../agents/agent-scope.js";
import { resolveModelAuthLabel } from "../../agents/model-auth-label.js";
import { listSubagentRunsForRequester } from "../../agents/subagent-registry.js";
import {
  resolveInternalSessionKey,
  resolveMainSessionAlias,
} from "../../agents/tools/sessions-helpers.js";
import type { OpenClawConfig } from "../../config/config.js";
import type { SessionEntry, SessionScope } from "../../config/sessions.js";
import { logVerbose } from "../../globals.js";
import {
  formatUsageWindowSummary,
  loadProviderUsageSummary,
  resolveUsageProviderId,
} from "../../infra/provider-usage.js";
import { normalizeGroupActivation } from "../group-activation.js";
import { resolveSelectedAndActiveModel } from "../model-runtime.js";
import { buildStatusMessage } from "../status.js";
import { getFollowupQueueDepth, resolveQueueSettings } from "./queue.js";
import { resolveSubagentLabel } from "./subagents-utils.js";

export async function buildStatusReply(params: {
  cfg: OpenClawConfig;
  command: CommandContext;
  sessionEntry?: SessionEntry;
  sessionKey: string;
  sessionScope?: SessionScope;
  storePath?: string;
  provider: string;
  model: string;
  contextTokens: number;
  resolvedThinkLevel?: ThinkLevel;
  resolvedVerboseLevel: VerboseLevel;
  resolvedReasoningLevel: ReasoningLevel;
  resolvedElevatedLevel?: ElevatedLevel;
  resolveDefaultThinkingLevel: () => Promise<ThinkLevel | undefined>;
  isGroup: boolean;
  defaultGroupActivation: () => "always" | "mention";
  mediaDecisions?: MediaUnderstandingDecision[];
}): Promise<ReplyPayload | undefined> {
  const {
    cfg,
    command,
    sessionEntry,
    sessionKey,
    sessionScope,
    storePath,
    provider,
    model,
    contextTokens,
    resolvedThinkLevel,
    resolvedVerboseLevel,
    resolvedReasoningLevel,
    resolvedElevatedLevel,
    resolveDefaultThinkingLevel,
    isGroup,
    defaultGroupActivation,
  } = params;
  if (!command.isAuthorizedSender) {
    logVerbose(`Ignoring /status from unauthorized sender: ${command.senderId || "<unknown>"}`);
    return undefined;
  }
  const statusAgentId = sessionKey
    ? resolveSessionAgentId({ sessionKey, config: cfg })
    : resolveDefaultAgentId(cfg);
  const statusAgentDir = resolveAgentDir(cfg, statusAgentId);

  const actualProvider = sessionEntry?.modelProvider || provider;
  const actualModel = sessionEntry?.model ?? model;
  const fallbackProvider =
    sessionEntry?.fallbackProvider?.trim() ||
    (sessionEntry?.fallbackModel ? actualProvider : undefined);
  const fallbackModel = sessionEntry?.fallbackModel?.trim();
  const fallbackActive =
    fallbackProvider && fallbackModel && (fallbackProvider !== provider || fallbackModel !== model);
  const selectionMatchesActual = actualProvider === provider && actualModel === model;
  const useActualProviderForUsage = Boolean(fallbackActive || selectionMatchesActual);
  const providerForUsage = useActualProviderForUsage ? actualProvider : provider;
  const actualUsageProvider = (() => {
    try {
      return resolveUsageProviderId(providerForUsage);
    } catch {
      return undefined;
    }
  })();

  const fallbackUsageProvider =
    useActualProviderForUsage && fallbackProvider && fallbackProvider !== providerForUsage
      ? (() => {
          try {
            return resolveUsageProviderId(fallbackProvider);
          } catch {
            return undefined;
          }
        })()
      : undefined;

  let usageLine: string | null = null;
  const providersToFetch: string[] = [];
  if (actualUsageProvider) {
    providersToFetch.push(actualUsageProvider);
  }
  if (fallbackUsageProvider && fallbackUsageProvider !== actualUsageProvider) {
    providersToFetch.push(fallbackUsageProvider);
  }

  if (providersToFetch.length > 0) {
    try {
      // Resolve auth for the ACTUAL provider variant (e.g., kimi-code-9, not just kimi-code)
      // This ensures we use the correct API key for the running provider
      const providerAuths: Array<{ provider: UsageProviderId; token: string }> = [];

      if (actualUsageProvider === "kimi-code" && providerForUsage) {
        // Extract suffix from providerForUsage (e.g., "kimi-code-9" → "9")
        const match = providerForUsage.match(/kimi-code-(\d+)$/);
        const suffix = match ? match[1] : null;
        const envVar = suffix ? `KIMI_CODE_${suffix}` : "KIMI_CODE";
        const apiKey = process.env[envVar];

        if (apiKey) {
          providerAuths.push({
            provider: "kimi-code",
            token: apiKey,
          });
        }
      }

      const usageSummary = await loadProviderUsageSummary({
        timeoutMs: 3500,
        providers: providersToFetch as UsageProviderId[],
        auth: providerAuths.length > 0 ? providerAuths : undefined,
        agentDir: statusAgentDir,
      });

      const parts: string[] = [];
      for (const usageEntry of usageSummary.providers) {
        if (usageEntry.error || usageEntry.windows.length === 0) {
          continue;
        }
        const isFallback = usageEntry.provider === fallbackUsageProvider;
        const isActual = usageEntry.provider === actualUsageProvider;
        const label = isFallback
          ? `${usageEntry.displayName} (fallback)`
          : isActual && fallbackUsageProvider
            ? `${usageEntry.displayName} (active)`
            : isActual && fallbackActive
              ? `${usageEntry.displayName} (fallback)`
              : usageEntry.displayName;
        const summaryLine = formatUsageWindowSummary(usageEntry, {
          now: Date.now(),
          maxWindows: 2,
          includeResets: true,
        });
        if (summaryLine) {
          parts.push(`${label}: ${summaryLine}`);
        }
      }

      if (parts.length > 0) {
        usageLine = `📊 Usage: ${parts.join(" · ")}`;
      }
    } catch {
      usageLine = null;
    }
  }
  const queueSettings = resolveQueueSettings({
    cfg,
    channel: command.channel,
    sessionEntry,
  });
  const queueKey = sessionKey ?? sessionEntry?.sessionId;
  const queueDepth = queueKey ? getFollowupQueueDepth(queueKey) : 0;
  const queueOverrides = Boolean(
    sessionEntry?.queueDebounceMs ?? sessionEntry?.queueCap ?? sessionEntry?.queueDrop,
  );

  let subagentsLine: string | undefined;
  if (sessionKey) {
    const { mainKey, alias } = resolveMainSessionAlias(cfg);
    const requesterKey = resolveInternalSessionKey({ key: sessionKey, alias, mainKey });
    const runs = listSubagentRunsForRequester(requesterKey);
    const verboseEnabled = resolvedVerboseLevel && resolvedVerboseLevel !== "off";
    if (runs.length > 0) {
      const active = runs.filter((entry) => !entry.endedAt);
      const done = runs.length - active.length;
      if (verboseEnabled) {
        const labels = active
          .map((entry) => resolveSubagentLabel(entry, ""))
          .filter(Boolean)
          .slice(0, 3);
        const labelText = labels.length ? ` (${labels.join(", ")})` : "";
        subagentsLine = `🤖 Subagents: ${active.length} active${labelText} · ${done} done`;
      } else if (active.length > 0) {
        subagentsLine = `🤖 Subagents: ${active.length} active`;
      }
    }
  }
  const groupActivation = isGroup
    ? (normalizeGroupActivation(sessionEntry?.groupActivation) ?? defaultGroupActivation())
    : undefined;
  const modelRefs = resolveSelectedAndActiveModel({
    selectedProvider: provider,
    selectedModel: model,
    sessionEntry,
  });
  const selectedModelAuth = resolveModelAuthLabel({
    provider,
    cfg,
    sessionEntry,
    agentDir: statusAgentDir,
  });
  const activeModelAuth = modelRefs.activeDiffers
    ? resolveModelAuthLabel({
        provider: modelRefs.active.provider,
        cfg,
        sessionEntry,
        agentDir: statusAgentDir,
      })
    : selectedModelAuth;
  const agentDefaults = cfg.agents?.defaults ?? {};
  const primaryModelLabel = fallbackActive
    ? `${provider}/${model} → ${fallbackProvider}/${fallbackModel} (fallback)`
    : `${provider}/${model}`;
  const statusText = buildStatusMessage({
    config: cfg,
    agent: {
      ...agentDefaults,
      model: {
        ...agentDefaults.model,
        primary: primaryModelLabel,
      },
      contextTokens,
      thinkingDefault: agentDefaults.thinkingDefault,
      verboseDefault: agentDefaults.verboseDefault,
      elevatedDefault: agentDefaults.elevatedDefault,
    },
    agentId: statusAgentId,
    sessionEntry,
    sessionKey,
    sessionScope,
    sessionStorePath: storePath,
    groupActivation,
    resolvedThink: resolvedThinkLevel ?? (await resolveDefaultThinkingLevel()),
    resolvedVerbose: resolvedVerboseLevel,
    resolvedReasoning: resolvedReasoningLevel,
    resolvedElevated: resolvedElevatedLevel,
    modelAuth: selectedModelAuth,
    activeModelAuth,
    usageLine: usageLine ?? undefined,
    queue: {
      mode: queueSettings.mode,
      depth: queueDepth,
      debounceMs: queueSettings.debounceMs,
      cap: queueSettings.cap,
      dropPolicy: queueSettings.dropPolicy,
      showDetails: queueOverrides,
    },
    subagentsLine,
    mediaDecisions: params.mediaDecisions,
    includeTranscriptUsage: false,
  });

  return { text: statusText };
}
