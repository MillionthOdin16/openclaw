import { describe, it, expect } from "vitest";
import { createReplyPrefixContext, createReplyPrefixOptions } from "./reply-prefix.js";
import type { OpenClawConfig } from "../config/types.js";

describe("createReplyPrefixContext", () => {
  const baseConfig: OpenClawConfig = {
    agents: {
      list: [
        {
          id: "default",
          identity: {
            name: "TestAgent",
            emoji: "🤖",
          },
        },
      ],
    },
  };

  it("should initialize context with identity name", () => {
    const bundle = createReplyPrefixContext({
      cfg: baseConfig,
      agentId: "default",
    });

    const ctx = bundle.responsePrefixContextProvider();
    expect(ctx.identityName).toBe("TestAgent");
    expect(ctx.provider).toBeUndefined();
    expect(ctx.model).toBeUndefined();
  });

  it("should resolve responsePrefix from global config", () => {
    const cfg: OpenClawConfig = {
      ...baseConfig,
      messages: {
        responsePrefix: "[GLOBAL]",
      },
    };

    const bundle = createReplyPrefixContext({
      cfg,
      agentId: "default",
    });

    expect(bundle.responsePrefix).toBe("[GLOBAL]");
  });

  it("should resolve responsePrefix from channel config", () => {
    const cfg: OpenClawConfig = {
      ...baseConfig,
      messages: {
        responsePrefix: "[GLOBAL]",
      },
      channels: {
        slack: {
          responsePrefix: "[SLACK]",
        },
      },
    };

    const bundle = createReplyPrefixContext({
      cfg,
      agentId: "default",
      channel: "slack",
    });

    expect(bundle.responsePrefix).toBe("[SLACK]");
  });

  it("should update context on model selection", () => {
    const bundle = createReplyPrefixContext({
      cfg: baseConfig,
      agentId: "default",
    });

    bundle.onModelSelected({
      provider: "openai",
      model: "gpt-4",
      thinkLevel: "high",
    });

    const ctx = bundle.responsePrefixContextProvider();
    expect(ctx.provider).toBe("openai");
    expect(ctx.model).toBe("gpt-4"); // Assuming extractShortModelName handles this correctly
    expect(ctx.thinkingLevel).toBe("high");
    expect(ctx.identityName).toBe("TestAgent");
  });

  it("should handle model name extraction", () => {
    const bundle = createReplyPrefixContext({
      cfg: baseConfig,
      agentId: "default",
    });

    bundle.onModelSelected({
      provider: "anthropic",
      model: "claude-3-opus-20240229",
      thinkLevel: "off",
    });

    const ctx = bundle.responsePrefixContextProvider();
    expect(ctx.provider).toBe("anthropic");
    // extractShortModelName should remove date suffix if present,
    // but looking at implementation: it removes -YYYYMMDD or -latest.
    // The implementation: .replace(/-\d{8}$/, "")
    // So it should be claude-3-opus
    expect(ctx.model).toBe("claude-3-opus");
    expect(ctx.modelFull).toBe("anthropic/claude-3-opus-20240229");
  });
});

describe("createReplyPrefixOptions", () => {
  it("should return the correct options object", () => {
    const cfg: OpenClawConfig = {
      agents: {
        list: [
          {
            id: "default",
            identity: { name: "AgentO" },
          },
        ],
      },
      messages: {
        responsePrefix: ">>",
      },
    };

    const options = createReplyPrefixOptions({
      cfg,
      agentId: "default",
    });

    expect(options).toHaveProperty("responsePrefix", ">>");
    expect(options).toHaveProperty("responsePrefixContextProvider");
    expect(options).toHaveProperty("onModelSelected");
    expect(typeof options.responsePrefixContextProvider).toBe("function");
    expect(typeof options.onModelSelected).toBe("function");

    // Verify context provider works
    const ctx = options.responsePrefixContextProvider();
    expect(ctx.identityName).toBe("AgentO");
  });
});
