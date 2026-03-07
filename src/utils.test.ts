import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  assertWebChannel,
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
  safeParseJson,
  resolveHomeDir,
  resolveJidToE164,
  resolveUserPath,
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

describe("clampNumber & clampInt", () => {
  it("clamps number correctly", () => {
    expect(clampNumber(5, 0, 10)).toBe(5);
    expect(clampNumber(-5, 0, 10)).toBe(0);
    expect(clampNumber(15, 0, 10)).toBe(10);
  });

  it("clamps integer correctly", () => {
    expect(clampInt(5.5, 0, 10)).toBe(5);
    expect(clampInt(-5.5, 0, 10)).toBe(0);
    expect(clampInt(15.5, 0, 10)).toBe(10);
  });
});

describe("pathExists", () => {
  it("returns true when path exists", async () => {
    await withTempDirSync("openclaw-test-", async (tmp) => {
      const target = path.join(tmp, "exists.txt");
      fs.writeFileSync(target, "content");
      expect(await pathExists(target)).toBe(true);
    });
  });

  it("returns false when path does not exist", async () => {
    await withTempDirSync("openclaw-test-", async (tmp) => {
      const target = path.join(tmp, "does-not-exist.txt");
      expect(await pathExists(target)).toBe(false);
    });
  });
});

describe("safeParseJson", () => {
  it("parses valid JSON", () => {
    expect(safeParseJson('{"a": 1}')).toEqual({ a: 1 });
    expect(safeParseJson('"foo"')).toBe("foo");
  });

  it("returns null for invalid JSON", () => {
    expect(safeParseJson('{"a": 1')).toBeNull();
    expect(safeParseJson("undefined")).toBeNull();
  });
});

describe("isRecord", () => {
  it("returns true for plain objects", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it("returns false for other types", () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord("string")).toBe(false);
    expect(isRecord(123)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });
});

describe("escapeRegExp", () => {
  it("escapes regex special characters", () => {
    expect(escapeRegExp("hello.world")).toBe("hello\\.world");
    expect(escapeRegExp("foo[bar]")).toBe("foo\\[bar\\]");
    expect(escapeRegExp("a*b+c?")).toBe("a\\*b\\+c\\?");
    expect(escapeRegExp("no-special-chars")).toBe("no-special-chars");
  });
});

describe("sliceUtf16Safe", () => {
  it("slices basic strings safely", () => {
    expect(sliceUtf16Safe("hello", 0, 3)).toBe("hel");
    expect(sliceUtf16Safe("hello", 2)).toBe("llo");
    expect(sliceUtf16Safe("hello", -2)).toBe("lo");
    expect(sliceUtf16Safe("hello", 1, -1)).toBe("ell");
  });

  it("handles negative indices correctly", () => {
    expect(sliceUtf16Safe("abcde", -3, -1)).toBe("cd");
  });

  it("handles reversed from and to limits", () => {
    expect(sliceUtf16Safe("hello", 4, 2)).toBe("ll");
  });

  it("does not split surrogate pairs at start limit", () => {
    const text = "a💩b"; // 💩 is \uD83D\uDCA9
    expect(text.length).toBe(4); // a, D83D, DCA9, b

    // start boundary falls between D83D and DCA9
    // It should increase from to skip the broken surrogate
    expect(sliceUtf16Safe(text, 2, 4)).toBe("b");
  });

  it("does not split surrogate pairs at end limit", () => {
    const text = "a💩b";

    // end boundary falls between D83D and DCA9
    // It should decrease to to exclude the broken surrogate
    expect(sliceUtf16Safe(text, 0, 2)).toBe("a");
  });

  it("extracts full surrogate pairs safely", () => {
    const text = "a💩b";
    expect(sliceUtf16Safe(text, 1, 3)).toBe("💩");
  });
});

describe("truncateUtf16Safe", () => {
  it("truncates string safely and avoids surrogate splits", () => {
    const text = "a💩b";

    // truncating at 2 would break the surrogate pair
    expect(truncateUtf16Safe(text, 2)).toBe("a");

    // truncating at 3 keeps the surrogate pair
    expect(truncateUtf16Safe(text, 3)).toBe("a💩");
  });

  it("returns original string if maxLen is greater", () => {
    expect(truncateUtf16Safe("hello", 10)).toBe("hello");
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

describe("isSelfChatMode", () => {
  it("returns false if selfE164 is falsy", () => {
    expect(isSelfChatMode(null, ["+15551234567"])).toBe(false);
    expect(isSelfChatMode(undefined, ["+15551234567"])).toBe(false);
    expect(isSelfChatMode("", ["+15551234567"])).toBe(false);
  });

  it("returns false if allowFrom is missing or empty", () => {
    expect(isSelfChatMode("+15551234567", [])).toBe(false);
    expect(isSelfChatMode("+15551234567", null)).toBe(false);
    expect(isSelfChatMode("+15551234567")).toBe(false);
  });

  it("returns true when selfE164 is in allowFrom", () => {
    expect(isSelfChatMode("+15551234567", ["+15551234567"])).toBe(true);
    expect(isSelfChatMode("+15551234567", ["+19990000000", "+15551234567"])).toBe(true);
  });

  it("normalizes numbers before comparing", () => {
    expect(isSelfChatMode("15551234567", ["whatsapp:+15551234567"])).toBe(true);
    expect(isSelfChatMode("whatsapp:+15551234567", ["15551234567"])).toBe(true);
  });

  it("returns false when selfE164 is not in allowFrom", () => {
    expect(isSelfChatMode("+15551234567", ["+19990000000"])).toBe(false);
  });

  it("returns false when allowFrom contains wildcard", () => {
    expect(isSelfChatMode("+15551234567", ["*"])).toBe(false);
  });

  it("handles malformed numbers in allowFrom safely", () => {
    expect(isSelfChatMode("+15551234567", ["invalid"])).toBe(false);
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

describe("displayPath & displayString", () => {
  it("displayPath uses shortenHomePath", () => {
    vi.stubEnv("OPENCLAW_HOME", "/srv/openclaw-home");
    vi.stubEnv("HOME", "/home/other");
    expect(displayPath(`${path.resolve("/srv/openclaw-home")}/.openclaw/openclaw.json`)).toBe(
      "$OPENCLAW_HOME/.openclaw/openclaw.json",
    );
    vi.unstubAllEnvs();
  });

  it("displayString uses shortenHomeInString", () => {
    vi.stubEnv("OPENCLAW_HOME", "/srv/openclaw-home");
    vi.stubEnv("HOME", "/home/other");
    expect(
      displayString(`config: ${path.resolve("/srv/openclaw-home")}/.openclaw/openclaw.json`),
    ).toBe("config: $OPENCLAW_HOME/.openclaw/openclaw.json");
    vi.unstubAllEnvs();
  });
});

describe("formatTerminalLink", () => {
  it("formats link correctly with force=true", () => {
    expect(formatTerminalLink("My Label", "https://example.com", { force: true })).toBe(
      "\u001b]8;;https://example.com\u0007My Label\u001b]8;;\u0007",
    );
  });

  it("strips escape characters from label and url", () => {
    expect(formatTerminalLink("My\u001bLabel", "https://example.com\u001b", { force: true })).toBe(
      "\u001b]8;;https://example.com\u0007MyLabel\u001b]8;;\u0007",
    );
  });

  it("uses fallback if specified and force=false", () => {
    expect(
      formatTerminalLink("My Label", "https://example.com", {
        force: false,
        fallback: "fallback string",
      }),
    ).toBe("fallback string");
  });

  it("uses default format if force=false and no fallback", () => {
    expect(formatTerminalLink("My Label", "https://example.com", { force: false })).toBe(
      "My Label (https://example.com)",
    );
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

  it("returns null when jid is falsy", async () => {
    await expect(resolveJidToE164(null)).resolves.toBeNull();
    await expect(resolveJidToE164(undefined)).resolves.toBeNull();
    await expect(resolveJidToE164("")).resolves.toBeNull();
  });

  it("returns null when lidLookup is not provided for @lid", async () => {
    await expect(resolveJidToE164("777@lid")).resolves.toBeNull();
  });

  it("returns null when lidLookup returns falsy", async () => {
    const lidLookup = {
      getPNForLID: vi.fn().mockResolvedValue(null),
    };
    await expect(resolveJidToE164("777@lid", { lidLookup })).resolves.toBeNull();
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
