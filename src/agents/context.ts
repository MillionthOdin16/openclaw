// Lazy-load pi-coding-agent model metadata so we can infer context windows when
// the agent reports a model id. This includes custom models.json entries.

import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "../config/config.js";
import { resolveOpenClawAgentDir } from "./agent-paths.js";
import { ensureOpenClawModelsJson } from "./models-config.js";

type ModelEntry = { id: string; contextWindow?: number };
type ModelRegistryLike = {
  getAvailable?: () => ModelEntry[];
  getAll: () => ModelEntry[];
};
type ConfigModelEntry = { id?: string; contextWindow?: number };
type ProviderConfigEntry = { models?: ConfigModelEntry[] };
type ModelsConfig = { providers?: Record<string, ProviderConfigEntry | undefined> };

export function applyDiscoveredContextWindows(params: {
  cache: Map<string, number>;
  models: ModelEntry[];
}) {
  for (const model of params.models) {
    if (!model?.id) {
      continue;
    }
    const contextWindow =
      typeof model.contextWindow === "number" ? Math.trunc(model.contextWindow) : undefined;
    if (!contextWindow || contextWindow <= 0) {
      continue;
    }
    const existing = params.cache.get(model.id);
    // When multiple providers expose the same model id with different limits,
    // prefer the smaller window so token budgeting is fail-safe (no overestimation).
    if (existing === undefined || contextWindow < existing) {
      params.cache.set(model.id, contextWindow);
    }
  }
}

export function applyConfiguredContextWindows(params: {
  cache: Map<string, number>;
  modelsConfig: ModelsConfig | undefined;
}) {
  const providers = params.modelsConfig?.providers;
  if (!providers || typeof providers !== "object") {
    return;
  }
  for (const provider of Object.values(providers)) {
    if (!Array.isArray(provider?.models)) {
      continue;
    }
    for (const model of provider.models) {
      const modelId = typeof model?.id === "string" ? model.id : undefined;
      const contextWindow =
        typeof model?.contextWindow === "number" ? model.contextWindow : undefined;
      if (!modelId || !contextWindow || contextWindow <= 0) {
        continue;
      }
      params.cache.set(modelId, contextWindow);
    }
  }
}

const MODEL_CACHE = new Map<string, number>();
const loadPromise = (async () => {
  let cfg: ReturnType<typeof loadConfig> | undefined;
  try {
    cfg = loadConfig();
  } catch {
    // If config can't be loaded, leave cache empty.
    return;
  }

  try {
    await ensureOpenClawModelsJson(cfg);
  } catch {
    // Continue with best-effort discovery/overrides.
  }

  const agentDir = resolveOpenClawAgentDir();
  try {
    const { discoverAuthStorage, discoverModels } = await import("./pi-model-discovery.js");
    const authStorage = discoverAuthStorage(agentDir);
    const modelRegistry = discoverModels(authStorage, agentDir) as unknown as ModelRegistryLike;
    const models =
      typeof modelRegistry.getAvailable === "function"
        ? modelRegistry.getAvailable()
        : modelRegistry.getAll();
    applyDiscoveredContextWindows({
      cache: MODEL_CACHE,
      models,
    });
  } catch {
    // Ignore discovery errors; will supplement with manual parse.
  }

    // Fallback/Supplement: Manual parse of models.json to ensure everything is captured
    // (Bypasses SDK filtering of unrecognized providers or models without keys)
    try {
      const modelsJsonPath = path.join(agentDir, "models.json");
      if (fs.existsSync(modelsJsonPath)) {
        const raw = fs.readFileSync(modelsJsonPath, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed?.providers && typeof parsed.providers === "object") {
          for (const [providerId, provider] of Object.entries(parsed.providers)) {
            const p = provider as { models?: unknown[] };
            if (p && typeof p === "object" && Array.isArray(p.models)) {
              for (const m of p.models) {
                const modelEntry = m as { id?: string; contextWindow?: number };
                if (modelEntry?.id && typeof modelEntry.contextWindow === "number") {
                  const fullId = `${providerId}/${modelEntry.id}`;
                  MODEL_CACHE.set(fullId, modelEntry.contextWindow);
                  // Overwrite even if exists, manual models.json is the source of truth for custom entries
                  MODEL_CACHE.set(modelEntry.id, modelEntry.contextWindow);
                }
              }
            }
          }
        }
      }
    } catch {
      // Ignore manual parse errors.
    }
  } catch {
    // Top-level failure; lookup will fall back to defaults.
  }

  applyConfiguredContextWindows({
    cache: MODEL_CACHE,
    modelsConfig: cfg.models as ModelsConfig | undefined,
  });
})().catch(() => {
  // Keep lookup best-effort.
});

export async function preloadContextCache(): Promise<void> {
  await loadPromise;
}

export function lookupContextTokens(modelId?: string): number | undefined {
  if (!modelId) {
    return undefined;
  }
  // Best-effort: kick off loading, but don't block for sync callers.
  void loadPromise;

  const cached = MODEL_CACHE.get(modelId);
  if (cached !== undefined) {
    return cached;
  }

  // Handle provider-prefixed models: "provider/model-id" -> "model-id"
  if (modelId.includes("/")) {
    const parts = modelId.split("/");
    const suffix = parts[parts.length - 1];
    if (suffix) {
      const suffixCached = MODEL_CACHE.get(suffix);
      if (suffixCached !== undefined) {
        return suffixCached;
      }
    }
  }

  return undefined;
}
