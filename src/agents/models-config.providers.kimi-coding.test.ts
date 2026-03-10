import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { captureEnv } from "../test-utils/env.js";
import { resolveEnvApiKey } from "./model-auth.js";
import { normalizeProviderId } from "./model-selection.js";
import { buildKimiCodingProvider, resolveImplicitProviders } from "./models-config.providers.js";

describe("kimi-coding implicit provider (#22409)", () => {
  it("should include kimi-coding when KIMI_API_KEY is configured", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "openclaw-test-"));
    const envSnapshot = captureEnv(["KIMI_API_KEY"]);
    process.env.KIMI_API_KEY = "test-key";

    try {
      const providers = await resolveImplicitProviders({ agentDir });
      expect(providers?.["kimi-coding"]).toBeDefined();
      expect(providers?.["kimi-coding"]?.api).toBe("anthropic-messages");
      expect(providers?.["kimi-coding"]?.baseUrl).toBe("https://api.kimi.com/coding/");
    } finally {
      envSnapshot.restore();
    }
  });

  it("should include kimi-coding when KIMI_CODE is configured", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "openclaw-test-"));
    const envSnapshot = captureEnv(["KIMI_CODE", "KIMI_API_KEY"]);
    delete process.env.KIMI_API_KEY;
    process.env.KIMI_CODE = "test-key-from-kimi-code";

    try {
      const providers = await resolveImplicitProviders({ agentDir });
      expect(providers?.["kimi-coding"]).toBeDefined();
      expect(providers?.["kimi-coding"]?.api).toBe("anthropic-messages");
    } finally {
      envSnapshot.restore();
    }
  });

  it("should build kimi-coding provider with anthropic-messages API", () => {
    const provider = buildKimiCodingProvider();
    expect(provider.api).toBe("anthropic-messages");
    expect(provider.baseUrl).toBe("https://api.kimi.com/coding/");
    expect(provider.models).toBeDefined();
    expect(provider.models.length).toBeGreaterThan(0);
    expect(provider.models[0].id).toBe("k2p5");
  });

  it("should not include kimi-coding when no API key is configured", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "openclaw-test-"));
    const envSnapshot = captureEnv(["KIMI_API_KEY", "KIMI_CODE"]);
    delete process.env.KIMI_API_KEY;
    delete process.env.KIMI_CODE;

    try {
      const providers = await resolveImplicitProviders({ agentDir });
      expect(providers?.["kimi-coding"]).toBeUndefined();
    } finally {
      envSnapshot.restore();
    }
  });
});

describe("kimi-code-N provider normalization and pool key rotation", () => {
  it("should normalize kimi-code-N to kimi-coding-N", () => {
    expect(normalizeProviderId("kimi-code-2")).toBe("kimi-coding-2");
    expect(normalizeProviderId("kimi-code-3")).toBe("kimi-coding-3");
    expect(normalizeProviderId("kimi-code-10")).toBe("kimi-coding-10");
  });

  it("should still normalize kimi-code to kimi-coding", () => {
    expect(normalizeProviderId("kimi-code")).toBe("kimi-coding");
  });

  it("should resolve KIMI_CODE_N for kimi-coding-N providers", () => {
    const envSnapshot = captureEnv(["KIMI_CODE_2", "KIMI_CODE_3"]);
    process.env.KIMI_CODE_2 = "pool-key-2";
    process.env.KIMI_CODE_3 = "pool-key-3";

    try {
      expect(resolveEnvApiKey("kimi-coding-2")?.apiKey).toBe("pool-key-2");
      expect(resolveEnvApiKey("kimi-coding-3")?.apiKey).toBe("pool-key-3");
    } finally {
      envSnapshot.restore();
    }
  });

  it("should build kimi-coding-N providers when KIMI_CODE_N env vars are set", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "openclaw-test-"));
    const envSnapshot = captureEnv(["KIMI_CODE_2", "KIMI_CODE_3", "KIMI_CODE_4"]);
    process.env.KIMI_CODE_2 = "pool-key-2";
    process.env.KIMI_CODE_3 = "pool-key-3";
    delete process.env.KIMI_CODE_4;

    try {
      const providers = await resolveImplicitProviders({ agentDir });
      expect(providers?.["kimi-coding-2"]).toBeDefined();
      expect(providers?.["kimi-coding-2"]?.api).toBe("anthropic-messages");
      expect(providers?.["kimi-coding-2"]?.baseUrl).toBe("https://api.kimi.com/coding/");
      expect(providers?.["kimi-coding-3"]).toBeDefined();
      expect(providers?.["kimi-coding-4"]).toBeUndefined();
    } finally {
      envSnapshot.restore();
    }
  });
});
