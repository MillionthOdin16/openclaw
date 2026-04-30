import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  assertWebChannel,
  clampInt,
  clampNumber,
  CONFIG_DIR,
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

describe("sliceUtf16Safe", () => {
  it("slices strings containing surrogate pairs safely", () => {
    const text = "a😃b";
    expect(text.length).toBe(4);
    expect(sliceUtf16Safe(text, 0, 1)).toBe("a");
    // "😃" takes up indices 1 and 2 but sliceUtf16Safe shrinks inward for safety, so slicing exactly half a surrogate returns empty
    expect(sliceUtf16Safe(text, 1, 2)).toBe("");
    // To get the full emoji, you need to include its full length
    expect(sliceUtf16Safe(text, 1, 3)).toBe("😃");
    expect(sliceUtf16Safe(text, 0, 2)).toBe("a");
    expect(sliceUtf16Safe(text, 0, 3)).toBe("a😃");
    expect(sliceUtf16Safe(text, 2, 4)).toBe("b");
    expect(sliceUtf16Safe(text, 1, 4)).toBe("😃b");
    expect(sliceUtf16Safe(text, -3, -1)).toBe("😃");
  });

  it("handles out-of-bounds correctly", () => {
    expect(sliceUtf16Safe("abc", 0, 5)).toBe("abc");
    expect(sliceUtf16Safe("abc", -10)).toBe("abc");
  });

  it("swaps from and to if needed", () => {
    expect(sliceUtf16Safe("abc", 2, 1)).toBe("b");
  });
});

describe("truncateUtf16Safe", () => {
  it("truncates strings safely without breaking surrogate pairs", () => {
    const text = "a😃b";
    expect(truncateUtf16Safe(text, 5)).toBe("a😃b");
    expect(truncateUtf16Safe(text, 1)).toBe("a");
    // Breaking halfway through 😃 excludes it completely due to sliceUtf16Safe shrinking inward
    expect(truncateUtf16Safe(text, 2)).toBe("a");
    expect(truncateUtf16Safe(text, 3)).toBe("a😃");
    expect(truncateUtf16Safe(text, 4)).toBe("a😃b");
  });
});

describe("safeParseJson", () => {
  it("parses valid JSON", () => {
    expect(safeParseJson('{"a": 1}')).toEqual({ a: 1 });
    expect(safeParseJson('"string"')).toBe("string");
  });

  it("returns null for invalid JSON", () => {
    expect(safeParseJson("{a: 1}")).toBeNull();
    expect(safeParseJson("undefined")).toBeNull();
  });
});

describe("escapeRegExp", () => {
  it("escapes special regex characters", () => {
    expect(escapeRegExp(".*+?^${}()|[]\\")).toBe("\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");
    expect(escapeRegExp("abc.def")).toBe("abc\\.def");
  });
});

describe("clampNumber", () => {
  it("clamps values", () => {
    expect(clampNumber(5, 0, 10)).toBe(5);
    expect(clampNumber(-5, 0, 10)).toBe(0);
    expect(clampNumber(15, 0, 10)).toBe(10);
  });
});

describe("clampInt", () => {
  it("clamps and floors values", () => {
    expect(clampInt(5.5, 0, 10)).toBe(5);
    expect(clampInt(-5.5, 0, 10)).toBe(0);
    expect(clampInt(15.5, 0, 10)).toBe(10);
  });
});

describe("pathExists", () => {
  it("returns true if path exists", async () => {
    const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), "openclaw-test-"));
    try {
      const target = path.join(tmp, "file.txt");
      await fs.promises.writeFile(target, "hello");
      expect(await pathExists(target)).toBe(true);
    } finally {
      await fs.promises.rm(tmp, { recursive: true, force: true });
    }
    // tmp directory should be deleted, so it no longer exists
    expect(await pathExists(tmp)).toBe(false);
  });

  it("returns false if path does not exist", async () => {
    const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), "openclaw-test-"));
    try {
      expect(await pathExists(path.join(tmp, "nonexistent"))).toBe(false);
    } finally {
      await fs.promises.rm(tmp, { recursive: true, force: true });
    }
  });
});

describe("isSelfChatMode", () => {
  it("returns true when selfE164 is in allowFrom", () => {
    expect(isSelfChatMode("+15551234567", ["+15551234567"])).toBe(true);
    expect(isSelfChatMode("+15551234567", ["+15559999999", "whatsapp:+15551234567"])).toBe(true);
  });

  it("returns false when selfE164 is not in allowFrom", () => {
    expect(isSelfChatMode("+15551234567", ["+15559999999"])).toBe(false);
    expect(isSelfChatMode("+15551234567", [])).toBe(false);
  });

  it("returns false when allowFrom is wildcard", () => {
    expect(isSelfChatMode("+15551234567", ["*"])).toBe(false);
  });

  it("returns false for invalid inputs", () => {
    expect(isSelfChatMode(null, ["+15551234567"])).toBe(false);
    expect(isSelfChatMode("+15551234567", null)).toBe(false);
  });
});

describe("formatTerminalLink", () => {
  it("formats link when forced", () => {
    expect(formatTerminalLink("Label", "https://example.com", { force: true })).toBe(
      "\u001b]8;;https://example.com\u0007Label\u001b]8;;\u0007",
    );
  });

  it("uses fallback when force is false", () => {
    expect(formatTerminalLink("Label", "https://example.com", { force: false })).toBe(
      "Label (https://example.com)",
    );
    expect(
      formatTerminalLink("Label", "https://example.com", { force: false, fallback: "Fallback" }),
    ).toBe("Fallback");
  });
});

describe("isRecord", () => {
  it("returns true for records", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it("returns false for non-records", () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord("string")).toBe(false);
    expect(isRecord(123)).toBe(false);
  });
});

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
