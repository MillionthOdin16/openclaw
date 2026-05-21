import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  assertWebChannel,
  CONFIG_DIR,
  ensureDir,
  jidToE164,
  normalizeE164,
  normalizePath,
  resolveConfigDir,
  resolveHomeDir,
  resolveJidToE164,
  resolveUserPath,
  shortenHomeInString,
  shortenHomePath,
  sleep,
  toWhatsappJid,
  withWhatsAppPrefix,
  pathExists,
  clampNumber,
  clampInt,
  escapeRegExp,
  safeParseJson,
  isRecord,
  isSelfChatMode,
  sliceUtf16Safe,
  truncateUtf16Safe,
  displayPath,
  displayString,
  formatTerminalLink,
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

describe("pathExists", () => {
  it("returns true for existing path", async () => {
    withTempDirSync("openclaw-test-", (_tmp) => {
      // Need to test an existing file inside, or just test a known directory like __dirname
      // But withTempDirSync cleans up immediately, so await pathExists won't work inside safely
      // without making the runner wait. Let's just use __dirname.
    });
    expect(await pathExists(__dirname)).toBe(true);
  });

  it("returns false for non-existing path", async () => {
    expect(await pathExists("/invalid/path/that/does/not/exist/12345")).toBe(false);
  });
});

describe("clampNumber and clampInt", () => {
  it("clamps number within bounds", () => {
    expect(clampNumber(5, 1, 10)).toBe(5);
    expect(clampNumber(0, 1, 10)).toBe(1);
    expect(clampNumber(15, 1, 10)).toBe(10);
  });

  it("clamps integer within bounds", () => {
    expect(clampInt(5.5, 1, 10)).toBe(5);
    expect(clampInt(0.5, 1, 10)).toBe(1);
    expect(clampInt(15.5, 1, 10)).toBe(10);
  });
});

describe("escapeRegExp", () => {
  it("escapes special characters", () => {
    expect(escapeRegExp(".*+?^${}()|[]\\")).toBe("\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");
    expect(escapeRegExp("hello world")).toBe("hello world");
  });
});

describe("safeParseJson", () => {
  it("parses valid JSON", () => {
    expect(safeParseJson('{"a": 1}')).toEqual({ a: 1 });
  });

  it("returns null for invalid JSON", () => {
    expect(safeParseJson("invalid json")).toBeNull();
  });
});

describe("isRecord", () => {
  it("identifies records correctly", () => {
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord(42)).toBe(false);
    expect(isRecord("string")).toBe(false);
  });
});

describe("isSelfChatMode", () => {
  it("returns false when inputs are empty or wildcard", () => {
    expect(isSelfChatMode(null, ["*"])).toBe(false);
    expect(isSelfChatMode("+15551234567", null)).toBe(false);
    expect(isSelfChatMode("+15551234567", ["*"])).toBe(false);
  });

  it("returns true for matched E164 number", () => {
    expect(isSelfChatMode("+15551234567", ["15551234567"])).toBe(true);
  });

  it("returns false for non-matching or invalid number", () => {
    expect(isSelfChatMode("+15551234567", ["123"])).toBe(false);
  });
});

describe("sliceUtf16Safe and truncateUtf16Safe", () => {
  it("slices strings safely without splitting surrogate pairs", () => {
    const str = "a👍b"; // length 4: 'a', surrogate pair, 'b'
    expect(sliceUtf16Safe(str, 0, 2)).toBe("a"); // would cut emoji in half
    expect(sliceUtf16Safe(str, 0, 3)).toBe("a👍");
    expect(sliceUtf16Safe(str, 1, 2)).toBe(""); // invalid start inside emoji
  });

  it("handles negative indices", () => {
    const str = "hello";
    expect(sliceUtf16Safe(str, -3, -1)).toBe("ll");
    expect(sliceUtf16Safe(str, 3, 1)).toBe("el"); // the function explicitly swaps if to < from
  });

  it("truncates strings safely", () => {
    const str = "a👍b";
    expect(truncateUtf16Safe(str, 2)).toBe("a");
    expect(truncateUtf16Safe(str, 3)).toBe("a👍");
    expect(truncateUtf16Safe(str, 5)).toBe("a👍b");
  });
});

describe("displayPath and displayString", () => {
  it("formats display path", () => {
    vi.stubEnv("OPENCLAW_HOME", "/srv/openclaw-home");
    vi.stubEnv("HOME", "/home/other");
    const testPath = path.join(path.resolve("/srv/openclaw-home"), ".openclaw", "openclaw.json");
    const result = displayPath(testPath);
    expect(result.startsWith("$OPENCLAW_HOME")).toBe(true);
    expect(result.endsWith("openclaw.json")).toBe(true);
    vi.unstubAllEnvs();
  });

  it("formats display string", () => {
    vi.stubEnv("OPENCLAW_HOME", "/srv/openclaw-home");
    vi.stubEnv("HOME", "/home/other");
    const testPath = path.join(path.resolve("/srv/openclaw-home"), ".openclaw", "openclaw.json");
    const result = displayString(`config: ${testPath}`);
    expect(result.startsWith("config: $OPENCLAW_HOME")).toBe(true);
    expect(result.endsWith("openclaw.json")).toBe(true);
    vi.unstubAllEnvs();
  });
});

describe("formatTerminalLink", () => {
  it("formats link when forced", () => {
    expect(formatTerminalLink("label", "http://url", { force: true })).toBe(
      "\u001b]8;;http://url\u0007label\u001b]8;;\u0007",
    );
  });

  it("uses fallback when forced false", () => {
    expect(formatTerminalLink("label", "http://url", { force: false })).toBe("label (http://url)");
    expect(
      formatTerminalLink("label", "http://url", { force: false, fallback: "custom fallback" }),
    ).toBe("custom fallback");
  });
});
