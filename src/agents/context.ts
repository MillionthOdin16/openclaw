// Lazy-load pi-coding-agent model metadata so we can infer context windows when
// the agent reports a model id. This includes custom models.json entries.

import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "../config/config.js";
import { resolveOpenClawAgentDir } from "./agent-paths.js";
import { ensureOpenClawModelsJson } from "./models-config.js";

interface LocalModelEntry {
  id: string;
  contextWindow?: number;
}

const MODEL_CACHE = new Map<string, number>();
const loadPromise = (async () => {
  try {
    const { discoverAuthStorage, discoverModels } = await import("./pi-model-discovery.js");
    const cfg = loadConfig();
    await ensureOpenClawModelsJson(cfg);
    const agentDir = resolveOpenClawAgentDir();

    // Try robust discovery first
    try {
      const authStorage = discoverAuthStorage(agentDir);
      const modelRegistry = discoverModels(authStorage, agentDir);
      const models = modelRegistry.getAll() as LocalModelEntry[];
      for (const m of models) {
        if (m?.id && typeof m.contextWindow === "number" && m.contextWindow > 0) {
          MODEL_CACHE.set(m.id, m.contextWindow);
        }
      }
    } catch {
      // Ignore discovery errors; will supplement with manual parse
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
                  // Key by full ID "provider/model" and raw "model"
                  MODEL_CACHE.set(`${providerId}/${modelEntry.id}`, modelEntry.contextWindow);
                  if (!MODEL_CACHE.has(modelEntry.id)) {
                    MODEL_CACHE.set(modelEntry.id, modelEntry.contextWindow);
                  }
                }
              }
            }
          }
        }
      }
    } catch {
      // Ignore manual parse errors
    }
  } catch {
    // Top-level failure; lookup will fall back to defaults
  }
})();

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
