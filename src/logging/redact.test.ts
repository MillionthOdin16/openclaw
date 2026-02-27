import { describe, expect, it } from "vitest";
import { getDefaultRedactPatterns, redactSensitiveText } from "./redact.js";

const defaults = getDefaultRedactPatterns();

describe("redactSensitiveText", () => {
  it("masks env assignments while keeping the key", () => {
    const input = "OPENAI_API_KEY=sk-1234567890abcdef";
    const output = redactSensitiveText(input, {
      mode: "tools",
      patterns: defaults,
    });
    expect(output).toBe("OPENAI_API_KEY=sk-123…cdef");
  });

  it("masks CLI flags", () => {
    const input = "curl --token abcdef1234567890ghij https://api.test";
    const output = redactSensitiveText(input, {
      mode: "tools",
      patterns: defaults,
    });
    expect(output).toBe("curl --token abcdef…ghij https://api.test");
  });

  it("masks JSON fields", () => {
    const input = '{"token":"abcdef1234567890ghij"}';
    const output = redactSensitiveText(input, {
      mode: "tools",
      patterns: defaults,
    });
    expect(output).toBe('{"token":"abcdef…ghij"}');
  });

  it("masks bearer tokens", () => {
    const input = "Authorization: Bearer abcdef1234567890ghij";
    const output = redactSensitiveText(input, {
      mode: "tools",
      patterns: defaults,
    });
    expect(output).toBe("Authorization: Bearer abcdef…ghij");
  });

  it("masks Telegram-style tokens", () => {
    const input = "123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef";
    const output = redactSensitiveText(input, {
      mode: "tools",
      patterns: defaults,
    });
    expect(output).toBe("123456…cdef");
  });

  it("masks Telegram Bot API URL tokens", () => {
    const input =
      "GET https://api.telegram.org/bot123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef/getMe HTTP/1.1";
    const output = redactSensitiveText(input, {
      mode: "tools",
      patterns: defaults,
    });
    expect(output).toBe("GET https://api.telegram.org/bot123456…cdef/getMe HTTP/1.1");
  });

  it("redacts short tokens fully", () => {
    const input = "TOKEN=shortvalue";
    const output = redactSensitiveText(input, {
      mode: "tools",
      patterns: defaults,
    });
    expect(output).toBe("TOKEN=***");
  });

  it("redacts private key blocks", () => {
    const input = [
      "-----BEGIN PRIVATE KEY-----",
      "ABCDEF1234567890",
      "ZYXWVUT987654321",
      "-----END PRIVATE KEY-----",
    ].join("\n");
    const output = redactSensitiveText(input, {
      mode: "tools",
      patterns: defaults,
    });
    expect(output).toBe(
      ["-----BEGIN PRIVATE KEY-----", "…redacted…", "-----END PRIVATE KEY-----"].join("\n"),
    );
  });

  it("honors custom patterns with flags", () => {
    const input = "token=abcdef1234567890ghij";
    const output = redactSensitiveText(input, {
      mode: "tools",
      patterns: ["/token=([A-Za-z0-9]+)/i"],
    });
    expect(output).toBe("token=abcdef…ghij");
  });

  it("ignores unsafe nested-repetition custom patterns", () => {
    const input = `${"a".repeat(28)}!`;
    const output = redactSensitiveText(input, {
      mode: "tools",
      patterns: ["(a+)+$"],
    });
    expect(output).toBe(input);
  });

  it("skips redaction when mode is off", () => {
    const input = "OPENAI_API_KEY=sk-1234567890abcdef";
    const output = redactSensitiveText(input, {
      mode: "off",
      patterns: defaults,
    });
    expect(output).toBe(input);
  });

  describe("Vendor Specific Tokens", () => {
    it("redacts OpenAI API keys", () => {
      const input = "Found key: sk-1234567890abcdef1234567890abcdef";
      const output = redactSensitiveText(input, {
        mode: "tools",
        patterns: defaults,
      });
      expect(output).toBe("Found key: sk-123…cdef");
    });

    it("redacts GitHub Personal Access Tokens (ghp_)", () => {
      const input = "Token: ghp_1234567890abcdef1234567890abcdef";
      const output = redactSensitiveText(input, {
        mode: "tools",
        patterns: defaults,
      });
      expect(output).toBe("Token: ghp_12…cdef");
    });

    it("redacts GitHub Fine-grained PATs (github_pat_)", () => {
      const input = "PAT: github_pat_1234567890abcdef1234567890abcdef";
      const output = redactSensitiveText(input, {
        mode: "tools",
        patterns: defaults,
      });
      expect(output).toBe("PAT: github…cdef");
    });

    it("redacts Slack User/Bot tokens (xoxb-)", () => {
      const input = "Slack: xoxb-1234567890-abcdef";
      const output = redactSensitiveText(input, {
        mode: "tools",
        patterns: defaults,
      });
      expect(output).toBe("Slack: xoxb-1…cdef");
    });

    it("redacts Slack User tokens (xoxp-)", () => {
        const input = "Slack User: xoxp-1234567890-abcdef";
        const output = redactSensitiveText(input, {
          mode: "tools",
          patterns: defaults,
        });
        expect(output).toBe("Slack User: xoxp-1…cdef");
    });

    it("redacts Slack App tokens (xapp-)", () => {
      const input = "App Token: xapp-1234567890-abcdef";
      const output = redactSensitiveText(input, {
        mode: "tools",
        patterns: defaults,
      });
      expect(output).toBe("App Token: xapp-1…cdef");
    });

    it("redacts Google API Keys (AIza)", () => {
      const input = "Google Key: AIzaSyB1234567890abcdef1234567890";
      const output = redactSensitiveText(input, {
        mode: "tools",
        patterns: defaults,
      });
      expect(output).toBe("Google Key: AIzaSy…7890");
    });

    it("redacts Google Client Secrets (gsk_)", () => {
      const input = "Google Secret: gsk_1234567890abcdef1234567890";
      const output = redactSensitiveText(input, {
        mode: "tools",
        patterns: defaults,
      });
      expect(output).toBe("Google Secret: gsk_12…7890");
    });

    it("redacts NPM Automation Tokens (npm_)", () => {
      const input = "NPM Token: npm_1234567890abcdef1234567890";
      const output = redactSensitiveText(input, {
        mode: "tools",
        patterns: defaults,
      });
      expect(output).toBe("NPM Token: npm_12…7890");
    });

    it("redacts Perplexity API Keys (pplx-)", () => {
      const input = "PPLX Key: pplx-1234567890abcdef1234567890";
      const output = redactSensitiveText(input, {
        mode: "tools",
        patterns: defaults,
      });
      expect(output).toBe("PPLX Key: pplx-1…7890");
    });

    it("redacts multiple tokens in a single string", () => {
      const input = "Keys: sk-1234567890abcdef and ghp_1234567890abcdef1234567890abcdef";
      const output = redactSensitiveText(input, {
        mode: "tools",
        patterns: defaults,
      });
      expect(output).toBe("Keys: sk-123…cdef and ghp_12…cdef");
    });

    it("redacts tokens at string boundaries", () => {
      const input = "sk-1234567890abcdef";
      const output = redactSensitiveText(input, {
        mode: "tools",
        patterns: defaults,
      });
      expect(output).toBe("sk-123…cdef");
    });
  });
});
