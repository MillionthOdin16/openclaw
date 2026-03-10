import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { captureEnv } from "../test-utils/env.js";
import { resolveEnvApiKey } from "./model-auth.js";
import { resolveImplicitProvidersForTest } from "./models-config.e2e-harness.js";
import { buildKimiCodingProvider } from "./models-config.providers.js";

describe("kimi-coding implicit provider (#22409)", () => {
  it("resolves KIMI_CODE for kimi-coding env auth", () => {
    const resolved = resolveEnvApiKey("kimi-coding", {
      KIMI_CODE: "test-kimi-code-key",
    } as NodeJS.ProcessEnv);
    expect(resolved?.source).toContain("KIMI_CODE");
  });

  it("should include kimi-coding when KIMI_CODE is configured", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "openclaw-test-"));
    const envSnapshot = captureEnv(["KIMI_CODE", "KIMI_API_KEY"]);
    process.env.KIMI_CODE = "test-kimi-code-key"; // pragma: allowlist secret
    delete process.env.KIMI_API_KEY;

    try {
      const providers = await resolveImplicitProvidersForTest({ agentDir });
      expect(providers?.["kimi-coding"]).toBeDefined();
      expect(providers?.["kimi-coding"]?.api).toBe("anthropic-messages");
      expect(providers?.["kimi-coding"]?.baseUrl).toBe("https://api.kimi.com/coding/");
    } finally {
      envSnapshot.restore();
    }
  });

  it("should include kimi-coding when KIMI_API_KEY is configured", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "openclaw-test-"));
    const envSnapshot = captureEnv(["KIMI_API_KEY"]);
    process.env.KIMI_API_KEY = "test-key"; // pragma: allowlist secret

    try {
      const providers = await resolveImplicitProvidersForTest({ agentDir });
      expect(providers?.["kimi-coding"]).toBeDefined();
      expect(providers?.["kimi-coding"]?.api).toBe("anthropic-messages");
      expect(providers?.["kimi-coding"]?.baseUrl).toBe("https://api.kimi.com/coding/");
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
    const envSnapshot = captureEnv(["KIMI_API_KEY"]);
    delete process.env.KIMI_API_KEY;

    try {
      const providers = await resolveImplicitProvidersForTest({ agentDir });
      expect(providers?.["kimi-coding"]).toBeUndefined();
    } finally {
      envSnapshot.restore();
    }
  });

  it("should include pooled kimi providers when KIMI_CODE_N vars are configured", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "openclaw-test-"));
    const envSnapshot = captureEnv([
      "KIMI_CODE",
      "KIMI_API_KEY",
      "KIMI_CODE_2",
      "KIMI_CODE_10",
      "KIMI_CODE_11",
    ]);
    delete process.env.KIMI_CODE;
    delete process.env.KIMI_API_KEY;
    process.env.KIMI_CODE_2 = "k2"; // pragma: allowlist secret
    process.env.KIMI_CODE_10 = "k10"; // pragma: allowlist secret
    delete process.env.KIMI_CODE_11;

    try {
      const providers = await resolveImplicitProvidersForTest({ agentDir });
      expect(providers?.["kimi-coding-2"]).toBeDefined();
      expect(providers?.["kimi-coding-10"]).toBeDefined();
      expect(providers?.["kimi-coding-11"]).toBeUndefined();
    } finally {
      envSnapshot.restore();
    }
  });
});
