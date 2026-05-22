import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  assertWebChannel,
  clamp,
  clampInt,
  clampNumber,
  CONFIG_DIR,
  displayPath,
  displayString,
  ensureDir,
  escapeRegExp,
  formatTerminalLink,
  isRecord,
  isSelfChatMode,
  jidToE164,
  normalizeE164,
  normalizePath,
  pathExists,
  resolveConfigDir,
  resolveHomeDir,
  resolveJidToE164,
  resolveUserPath,
  safeParseJson,
  shortenHomeInString,
  shortenHomePath,
  sliceUtf16Safe,
  sleep,
  toWhatsappJid,
  truncateUtf16Safe,
  withWhatsAppPrefix,
} from "./utils.js";

function withTempDirSync<T>(prefix: string, run: (dir: string) => T): T {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  try {
    return run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe("normalizePath", () => {
  it("adds leading slash when missing", () => {
    expect(normalizePath("foo")).toBe("/foo");
  });

  it("keeps existing slash", () => {
    expect(normalizePath("/bar")).toBe("/bar");
  });
});

describe("withWhatsAppPrefix", () => {
  it("adds whatsapp prefix", () => {
    expect(withWhatsAppPrefix("+1555")).toBe("whatsapp:+1555");
  });

  it("leaves prefixed intact", () => {
    expect(withWhatsAppPrefix("whatsapp:+1555")).toBe("whatsapp:+1555");
  });
});

describe("ensureDir", () => {
  it("creates nested directory", async () => {
    await withTempDirSync("openclaw-test-", async (tmp) => {
      const target = path.join(tmp, "nested", "dir");
      await ensureDir(target);
      expect(fs.existsSync(target)).toBe(true);
    });
  });
});

describe("pathExists", () => {
  it("returns true for existing file", async () => {
    expect(await pathExists("package.json")).toBe(true);
  });

  it("returns false for non-existent file", async () => {
    expect(await pathExists("non-existent-file-xyz.txt")).toBe(false);
  });
});

describe("clampNumber & clamp", () => {
  it("clamps values within range", () => {
    expect(clampNumber(5, 0, 10)).toBe(5);
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps values below min", () => {
    expect(clampNumber(-5, 0, 10)).toBe(0);
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps values above max", () => {
    expect(clampNumber(15, 0, 10)).toBe(10);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("clampInt", () => {
  it("clamps and floors values", () => {
    expect(clampInt(5.5, 0, 10)).toBe(5);
    expect(clampInt(-5.5, 0, 10)).toBe(0);
    expect(clampInt(15.5, 0, 10)).toBe(10);
  });
});

describe("escapeRegExp", () => {
  it("escapes special regex characters", () => {
    expect(escapeRegExp(".*+?^${}()|[]\\")).toBe("\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");
  });
});

describe("safeParseJson", () => {
  it("parses valid JSON", () => {
    expect(safeParseJson('{"foo": "bar"}')).toEqual({ foo: "bar" });
  });

  it("returns null for invalid JSON", () => {
    expect(safeParseJson("{bad json}")).toBeNull();
  });
});

describe("isRecord", () => {
  it("returns true for plain objects", () => {
    expect(isRecord({ foo: "bar" })).toBe(true);
  });

  it("returns false for arrays", () => {
    expect(isRecord(["foo", "bar"])).toBe(false);
  });

  it("returns false for null", () => {
    expect(isRecord(null)).toBe(false);
  });

  it("returns false for non-objects", () => {
    expect(isRecord(123)).toBe(false);
    expect(isRecord("string")).toBe(false);
  });
});

describe("isSelfChatMode", () => {
  it("returns false if selfE164 is null", () => {
    expect(isSelfChatMode(null, ["+1234"])).toBe(false);
  });

  it("returns false if allowFrom is missing or empty", () => {
    expect(isSelfChatMode("+1234", null)).toBe(false);
    expect(isSelfChatMode("+1234", [])).toBe(false);
  });

  it("returns false if allowFrom includes *", () => {
    expect(isSelfChatMode("+1234", ["*"])).toBe(false);
  });

  it("returns false if allowFrom parsing fails", () => {
    expect(isSelfChatMode("+1234", ["bad phone format"])).toBe(false);
  });

  it("returns true if self is in allowFrom", () => {
    expect(isSelfChatMode("+1234", ["+1234"])).toBe(true);
    expect(isSelfChatMode("whatsapp:+1234", ["+1234"])).toBe(true);
  });

  it("returns false if self is not in allowFrom", () => {
    expect(isSelfChatMode("+1234", ["+5678"])).toBe(false);
  });
});

describe("sliceUtf16Safe", () => {
  it("slices strings safely without breaking surrogates", () => {
    const text = "a𝌆b"; // 𝌆 is surrogate pair, length = 4 (index 1 and 2 are the pair)
    expect(sliceUtf16Safe(text, 0, 1)).toBe("a");
    expect(sliceUtf16Safe(text, 0, 2)).toBe("a"); // Adjusted to avoid splitting pair
    expect(sliceUtf16Safe(text, 0, 3)).toBe("a𝌆");
    expect(sliceUtf16Safe(text, 1, 2)).toBe(""); // Inside surrogate pair, adjusts to (2,2)
    expect(sliceUtf16Safe(text, 1, 3)).toBe("𝌆"); // Adjusts start to 2, end to 3 -> gets the pair
  });

  it("handles negative indices", () => {
    const text = "abc";
    expect(sliceUtf16Safe(text, -2)).toBe("bc");
    expect(sliceUtf16Safe(text, 0, -1)).toBe("ab");
  });

  it("swaps indices if end < start", () => {
    expect(sliceUtf16Safe("abc", 2, 1)).toBe("b");
  });
});

describe("truncateUtf16Safe", () => {
  it("truncates string to maxLen", () => {
    expect(truncateUtf16Safe("abc", 2)).toBe("ab");
  });

  it("does not truncate if length <= maxLen", () => {
    expect(truncateUtf16Safe("abc", 3)).toBe("abc");
    expect(truncateUtf16Safe("abc", 5)).toBe("abc");
  });

  it("handles negative and zero limits", () => {
    expect(truncateUtf16Safe("abc", 0)).toBe("");
    expect(truncateUtf16Safe("abc", -1)).toBe("");
  });
});

describe("sleep", () => {
  it("resolves after delay using fake timers", async () => {
    vi.useFakeTimers();
    const promise = sleep(1000);
    vi.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});

describe("assertWebChannel", () => {
  it("accepts valid channel", () => {
    expect(() => assertWebChannel("web")).not.toThrow();
  });

  it("throws for invalid channel", () => {
    expect(() => assertWebChannel("bad" as string)).toThrow();
  });
});

describe("normalizeE164 & toWhatsappJid", () => {
  it("strips formatting and prefixes", () => {
    expect(normalizeE164("whatsapp:(555) 123-4567")).toBe("+5551234567");
    expect(toWhatsappJid("whatsapp:+555 123 4567")).toBe("5551234567@s.whatsapp.net");
  });

  it("preserves existing JIDs", () => {
    expect(toWhatsappJid("123456789-987654321@g.us")).toBe("123456789-987654321@g.us");
    expect(toWhatsappJid("whatsapp:123456789-987654321@g.us")).toBe("123456789-987654321@g.us");
    expect(toWhatsappJid("1555123@s.whatsapp.net")).toBe("1555123@s.whatsapp.net");
  });
});

describe("jidToE164", () => {
  it("maps @lid using reverse mapping file", () => {
    const mappingPath = path.join(CONFIG_DIR, "credentials", "lid-mapping-123_reverse.json");
    const original = fs.readFileSync;
    const spy = vi.spyOn(fs, "readFileSync").mockImplementation((...args) => {
      if (args[0] === mappingPath) {
        return `"5551234"`;
      }
      return original(...args);
    });
    expect(jidToE164("123@lid")).toBe("+5551234");
    spy.mockRestore();
  });

  it("maps @lid from authDir mapping files", () => {
    withTempDirSync("openclaw-auth-", (authDir) => {
      const mappingPath = path.join(authDir, "lid-mapping-456_reverse.json");
      fs.writeFileSync(mappingPath, JSON.stringify("5559876"));
      expect(jidToE164("456@lid", { authDir })).toBe("+5559876");
    });
  });

  it("maps @hosted.lid from authDir mapping files", () => {
    withTempDirSync("openclaw-auth-", (authDir) => {
      const mappingPath = path.join(authDir, "lid-mapping-789_reverse.json");
      fs.writeFileSync(mappingPath, JSON.stringify(4440001));
      expect(jidToE164("789@hosted.lid", { authDir })).toBe("+4440001");
    });
  });

  it("accepts hosted PN JIDs", () => {
    expect(jidToE164("1555000:2@hosted")).toBe("+1555000");
  });

  it("falls back through lidMappingDirs in order", () => {
    withTempDirSync("openclaw-lid-a-", (first) => {
      withTempDirSync("openclaw-lid-b-", (second) => {
        const mappingPath = path.join(second, "lid-mapping-321_reverse.json");
        fs.writeFileSync(mappingPath, JSON.stringify("123321"));
        expect(jidToE164("321@lid", { lidMappingDirs: [first, second] })).toBe("+123321");
      });
    });
  });
});

describe("resolveConfigDir", () => {
  it("prefers ~/.openclaw when legacy dir is missing", async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "openclaw-config-dir-"));
    try {
      const newDir = path.join(root, ".openclaw");
      await fs.promises.mkdir(newDir, { recursive: true });
      const resolved = resolveConfigDir({} as NodeJS.ProcessEnv, () => root);
      expect(resolved).toBe(newDir);
    } finally {
      await fs.promises.rm(root, { recursive: true, force: true });
    }
  });
});

describe("resolveHomeDir", () => {
  it("prefers OPENCLAW_HOME over HOME", () => {
    vi.stubEnv("OPENCLAW_HOME", "/srv/openclaw-home");
    vi.stubEnv("HOME", "/home/other");

    expect(resolveHomeDir()).toBe(path.resolve("/srv/openclaw-home"));

    vi.unstubAllEnvs();
  });

  it("returns input if falsy", () => {
    expect(shortenHomeInString("")).toBe("");
  });

  it("returns input if home dir cannot be resolved", () => {
    vi.stubEnv("OPENCLAW_HOME", "");
    vi.stubEnv("HOME", "");
    vi.stubEnv("USERPROFILE", "");

    expect(shortenHomeInString("/some/path/file.txt")).toBe("/some/path/file.txt");

    vi.unstubAllEnvs();
  });
});

describe("displayPath & displayString", () => {
  it("displayPath formats path", () => {
    vi.stubEnv("HOME", "/home/user");
    expect(displayPath("/home/user/file.txt")).toBe("~/file.txt");
    vi.unstubAllEnvs();
  });

  it("displayString formats string", () => {
    vi.stubEnv("HOME", "/home/user");
    expect(displayString("path is /home/user/file.txt")).toBe("path is ~/file.txt");
    vi.unstubAllEnvs();
  });
});

describe("formatTerminalLink", () => {
  it("formats link for TTY", () => {
    expect(formatTerminalLink("label", "http://example.com", { force: true })).toBe(
      "\u001b]8;;http://example.com\u0007label\u001b]8;;\u0007",
    );
  });

  it("uses fallback if not TTY and force false", () => {
    expect(formatTerminalLink("label", "http://example.com", { force: false })).toBe(
      "label (http://example.com)",
    );
  });

  it("uses custom fallback if provided and not TTY", () => {
    expect(
      formatTerminalLink("label", "http://example.com", {
        force: false,
        fallback: "custom fallback",
      }),
    ).toBe("custom fallback");
  });

  it("removes escape characters from label and url", () => {
    expect(formatTerminalLink("label\u001b", "http://example.com\u001b", { force: true })).toBe(
      "\u001b]8;;http://example.com\u0007label\u001b]8;;\u0007",
    );
  });
});

describe("shortenHomePath", () => {
  it("uses $OPENCLAW_HOME prefix when OPENCLAW_HOME is set", () => {
    vi.stubEnv("OPENCLAW_HOME", "/srv/openclaw-home");
    vi.stubEnv("HOME", "/home/other");

    expect(shortenHomePath(`${path.resolve("/srv/openclaw-home")}/.openclaw/openclaw.json`)).toBe(
      "$OPENCLAW_HOME/.openclaw/openclaw.json",
    );

    vi.unstubAllEnvs();
  });
});

describe("shortenHomeInString", () => {
  it("uses $OPENCLAW_HOME replacement when OPENCLAW_HOME is set", () => {
    vi.stubEnv("OPENCLAW_HOME", "/srv/openclaw-home");
    vi.stubEnv("HOME", "/home/other");

    expect(
      shortenHomeInString(`config: ${path.resolve("/srv/openclaw-home")}/.openclaw/openclaw.json`),
    ).toBe("config: $OPENCLAW_HOME/.openclaw/openclaw.json");

    vi.unstubAllEnvs();
  });
});

describe("resolveJidToE164", () => {
  it("resolves @lid via lidLookup when mapping file is missing", async () => {
    const lidLookup = {
      getPNForLID: vi.fn().mockResolvedValue("777:0@s.whatsapp.net"),
    };
    await expect(resolveJidToE164("777@lid", { lidLookup })).resolves.toBe("+777");
    expect(lidLookup.getPNForLID).toHaveBeenCalledWith("777@lid");
  });

  it("skips lidLookup for non-lid JIDs", async () => {
    const lidLookup = {
      getPNForLID: vi.fn().mockResolvedValue("888:0@s.whatsapp.net"),
    };
    await expect(resolveJidToE164("888@s.whatsapp.net", { lidLookup })).resolves.toBe("+888");
    expect(lidLookup.getPNForLID).not.toHaveBeenCalled();
  });

  it("returns null when lidLookup throws", async () => {
    const lidLookup = {
      getPNForLID: vi.fn().mockRejectedValue(new Error("lookup failed")),
    };
    await expect(resolveJidToE164("777@lid", { lidLookup })).resolves.toBeNull();
    expect(lidLookup.getPNForLID).toHaveBeenCalledWith("777@lid");
  });
});

describe("resolveUserPath", () => {
  it("expands ~ to home dir", () => {
    expect(resolveUserPath("~")).toBe(path.resolve(os.homedir()));
  });

  it("expands ~/ to home dir", () => {
    expect(resolveUserPath("~/openclaw")).toBe(path.resolve(os.homedir(), "openclaw"));
  });

  it("resolves relative paths", () => {
    expect(resolveUserPath("tmp/dir")).toBe(path.resolve("tmp/dir"));
  });

  it("prefers OPENCLAW_HOME for tilde expansion", () => {
    vi.stubEnv("OPENCLAW_HOME", "/srv/openclaw-home");
    vi.stubEnv("HOME", "/home/other");

    expect(resolveUserPath("~/openclaw")).toBe(path.resolve("/srv/openclaw-home", "openclaw"));

    vi.unstubAllEnvs();
  });

  it("keeps blank paths blank", () => {
    expect(resolveUserPath("")).toBe("");
    expect(resolveUserPath("   ")).toBe("");
  });

  it("returns empty string for undefined/null input", () => {
    expect(resolveUserPath(undefined as unknown as string)).toBe("");
    expect(resolveUserPath(null as unknown as string)).toBe("");
  });
});
