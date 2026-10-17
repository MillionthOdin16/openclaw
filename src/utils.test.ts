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
  displayPath,
  displayString,
  formatTerminalLink,
  sleep,
  sliceUtf16Safe,
  truncateUtf16Safe,
  isSelfChatMode,
  pathExists,
  clampNumber,
  clampInt,
  escapeRegExp,
  safeParseJson,
  isRecord,
  toWhatsappJid,
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
    await withTempDirSync("openclaw-test-", async (tmp) => {
      expect(await pathExists(tmp)).toBe(true);
    });
  });

  it("returns false for non-existing path", async () => {
    await withTempDirSync("openclaw-test-", async (tmp) => {
      const nonExisting = path.join(tmp, "does-not-exist");
      expect(await pathExists(nonExisting)).toBe(false);
    });
  });
});

describe("clampNumber & clampInt", () => {
  it("clamps number within range", () => {
    expect(clampNumber(5, 1, 10)).toBe(5);
    expect(clampNumber(-5, 1, 10)).toBe(1);
    expect(clampNumber(15, 1, 10)).toBe(10);
  });

  it("clamps integer within range", () => {
    expect(clampInt(5.5, 1, 10)).toBe(5);
    expect(clampInt(-5.5, 1, 10)).toBe(1);
    expect(clampInt(15.5, 1, 10)).toBe(10);
  });
});

describe("escapeRegExp", () => {
  it("escapes regex characters", () => {
    expect(escapeRegExp(".*+?^${}()|[]\\")).toBe("\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");
  });
});

describe("safeParseJson", () => {
  it("parses valid JSON", () => {
    expect(safeParseJson('{"foo": "bar"}')).toEqual({ foo: "bar" });
  });

  it("returns null for invalid JSON", () => {
    expect(safeParseJson("invalid")).toBeNull();
  });
});

describe("isRecord", () => {
  it("returns true for records", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ foo: "bar" })).toBe(true);
  });

  it("returns false for non-records", () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord("string")).toBe(false);
    expect(isRecord(123)).toBe(false);
  });
});

describe("isSelfChatMode", () => {
  it("returns false when selfE164 is null", () => {
    expect(isSelfChatMode(null, ["+15551234567"])).toBe(false);
  });

  it("returns false when allowFrom is empty or null", () => {
    expect(isSelfChatMode("+15551234567", [])).toBe(false);
    expect(isSelfChatMode("+15551234567", null)).toBe(false);
  });

  it("returns false when allowFrom contains *", () => {
    expect(isSelfChatMode("+15551234567", ["*"])).toBe(false);
  });

  it("returns true when selfE164 is in allowFrom", () => {
    expect(isSelfChatMode("+15551234567", ["+15551234567"])).toBe(true);
    expect(isSelfChatMode("+15551234567", ["15551234567"])).toBe(true);
    expect(isSelfChatMode("+15551234567", ["whatsapp:+15551234567"])).toBe(true);
  });

  it("returns false when allowFrom has invalid elements but no match", () => {
    expect(isSelfChatMode("+15551234567", ["invalid"])).toBe(false);
  });
});

describe("sliceUtf16Safe & truncateUtf16Safe", () => {
  it("slices string safely with surrogates", () => {
    expect(sliceUtf16Safe("a👋b", 0, 2)).toBe("a");
    expect(sliceUtf16Safe("a👋b", 1, 3)).toBe("👋");
    expect(sliceUtf16Safe("a👋b", 1, 2)).toBe(""); // Split surrogate
  });

  it("truncates string safely", () => {
    expect(truncateUtf16Safe("a👋b", 2)).toBe("a");
    expect(truncateUtf16Safe("a👋b", 3)).toBe("a👋");
    expect(truncateUtf16Safe("a👋b", 4)).toBe("a👋b");
  });

  it("handles negative and out of bound indices", () => {
    expect(sliceUtf16Safe("abc", -1)).toBe("c");
    expect(sliceUtf16Safe("abc", -5)).toBe("abc");
    expect(sliceUtf16Safe("abc", 0, -1)).toBe("ab");
    expect(sliceUtf16Safe("abc", 5)).toBe("");
  });

  it("handles inverted from and to", () => {
    expect(sliceUtf16Safe("abc", 2, 1)).toBe("b");
  });
});

describe("displayPath & displayString", () => {
  it("shortens home path in displayPath", () => {
    vi.stubEnv("HOME", "/home/user");
    expect(displayPath("/home/user/test")).toBe("~/test");
    vi.unstubAllEnvs();
  });

  it("shortens home path in displayString", () => {
    vi.stubEnv("HOME", "/home/user");
    expect(displayString("path: /home/user/test")).toBe("path: ~/test");
    vi.unstubAllEnvs();
  });

  it("returns input when home is not set or empty", () => {
    vi.stubEnv("HOME", "");
    expect(displayPath("/home/user/test")).toBe("/home/user/test");
    expect(displayString("/home/user/test")).toBe("/home/user/test");
    vi.unstubAllEnvs();
  });

  it("returns empty when input is empty", () => {
    expect(displayPath("")).toBe("");
    expect(displayString("")).toBe("");
  });
});

describe("formatTerminalLink", () => {
  it("formats link with escape codes", () => {
    expect(formatTerminalLink("label", "url", { force: true })).toBe("\x1b]8;;url\x07label\x1b]8;;\x07");
  });

  it("strips existing escape codes", () => {
    expect(formatTerminalLink("l\x1babel", "u\x1brl", { force: true })).toBe("\x1b]8;;url\x07label\x1b]8;;\x07");
  });

  it("returns fallback if not forced and not TTY", () => {
    expect(formatTerminalLink("label", "url", { force: false })).toBe("label (url)");
    expect(formatTerminalLink("label", "url", { force: false, fallback: "custom" })).toBe("custom");
  });
});
