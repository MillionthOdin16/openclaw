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

async function withTempDirAsync<T>(prefix: string, run: (dir: string) => Promise<T>): Promise<T> {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), prefix));
  try {
    return await run(dir);
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
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
    await withTempDirAsync("openclaw-test-", async (tmp) => {
      const target = path.join(tmp, "nested", "dir");
      await ensureDir(target);
      expect(fs.existsSync(target)).toBe(true);
    });
  });
});

describe("pathExists", () => {
  it("returns true if path exists", async () => {
    await withTempDirAsync("openclaw-test-", async (tmp) => {
      const target = path.join(tmp, "exists.txt");
      fs.writeFileSync(target, "hello");
      expect(await pathExists(target)).toBe(true);
    });
  });

  it("returns false if path does not exist", async () => {
    await withTempDirAsync("openclaw-test-", async (tmp) => {
      const target = path.join(tmp, "not-exists.txt");
      expect(await pathExists(target)).toBe(false);
    });
  });
});

describe("clampNumber, clampInt, clamp", () => {
  it("clampNumber clamps to min", () => {
    expect(clampNumber(5, 10, 20)).toBe(10);
  });
  it("clampNumber clamps to max", () => {
    expect(clampNumber(25, 10, 20)).toBe(20);
  });
  it("clampNumber leaves within bounds", () => {
    expect(clampNumber(15, 10, 20)).toBe(15);
  });
  it("clampInt floors and clamps", () => {
    expect(clampInt(5.9, 10, 20)).toBe(10);
    expect(clampInt(25.9, 10, 20)).toBe(20);
    expect(clampInt(15.9, 10, 20)).toBe(15);
  });
  it("clamp works same as clampNumber", () => {
    expect(clamp(5, 10, 20)).toBe(10);
    expect(clamp(25, 10, 20)).toBe(20);
    expect(clamp(15, 10, 20)).toBe(15);
  });
});

describe("escapeRegExp", () => {
  it("escapes special regex characters", () => {
    expect(escapeRegExp(".*+?^${}()|[]\\")).toBe("\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");
  });
});

describe("safeParseJson", () => {
  it("parses valid JSON", () => {
    expect(safeParseJson('{"a": 1}')).toEqual({ a: 1 });
  });
  it("returns null on invalid JSON", () => {
    expect(safeParseJson("{a: 1}")).toBeNull();
  });
});

describe("isRecord", () => {
  it("returns true for plain object", () => {
    expect(isRecord({ a: 1 })).toBe(true);
  });
  it("returns false for array", () => {
    expect(isRecord([1, 2, 3])).toBe(false);
  });
  it("returns false for null", () => {
    expect(isRecord(null)).toBe(false);
  });
  it("returns false for primitive", () => {
    expect(isRecord("abc")).toBe(false);
    expect(isRecord(123)).toBe(false);
  });
});

describe("isSelfChatMode", () => {
  it("returns false if selfE164 is null", () => {
    expect(isSelfChatMode(null, ["+123"])).toBe(false);
  });
  it("returns false if allowFrom is missing/empty", () => {
    expect(isSelfChatMode("+123", [])).toBe(false);
    expect(isSelfChatMode("+123", null)).toBe(false);
  });
  it("returns true if self is in allowFrom", () => {
    expect(isSelfChatMode("+15551234567", ["+15551234567"])).toBe(true);
  });
  it("returns false if * in allowFrom", () => {
    expect(isSelfChatMode("+15551234567", ["*"])).toBe(false);
  });
  it("normalizes self and allowFrom", () => {
    expect(isSelfChatMode("whatsapp:+15551234567", ["+15551234567"])).toBe(true);
    expect(isSelfChatMode("+15551234567", ["whatsapp:+1 555 123 4567"])).toBe(true);
  });
  it("returns false on parse error in allowFrom", () => {
    expect(isSelfChatMode("+15551234567", ["badnumber"])).toBe(false);
  });
});

describe("sliceUtf16Safe", () => {
  it("slices basic string", () => {
    expect(sliceUtf16Safe("hello", 1, 4)).toBe("ell");
  });
  it("handles negative indices", () => {
    expect(sliceUtf16Safe("hello", -3, -1)).toBe("ll");
  });
  it("swaps indices if out of order", () => {
    expect(sliceUtf16Safe("hello", 4, 1)).toBe("ell");
  });
  it("safely slices surrogate pairs (avoids cutting in half)", () => {
    // 𝌆 is a surrogate pair (U+1D306)
    const str = "a𝌆b";

    // If slice ends inside the pair, it truncates safely
    // str is 4 characters long. Indices are: 0: 'a', 1: High Surrogate, 2: Low Surrogate, 3: 'b'
    expect(sliceUtf16Safe(str, 0, 2)).toBe("a"); // Ends at High surrogate, drops it
    expect(sliceUtf16Safe(str, 0, 3)).toBe("a𝌆"); // Includes the whole pair
    expect(sliceUtf16Safe(str, 1, 4)).toBe("𝌆b"); // Starts at High surrogate, includes both
    expect(sliceUtf16Safe(str, 1, 3)).toBe("𝌆"); // Starts at High surrogate and ends at Low surrogate, includes both
  });
});

describe("truncateUtf16Safe", () => {
  it("truncates safe", () => {
    expect(truncateUtf16Safe("hello", 10)).toBe("hello");
    expect(truncateUtf16Safe("hello", 3)).toBe("hel");
  });
});

describe("formatTerminalLink", () => {
  it("returns fallback if not TTY", () => {
    expect(formatTerminalLink("label", "url", { force: false })).toBe("label (url)");
    expect(formatTerminalLink("label", "url", { force: false, fallback: "custom fallback" })).toBe("custom fallback");
  });
  it("formats link if TTY/forced", () => {
    expect(formatTerminalLink("label", "url", { force: true })).toBe("\u001b]8;;url\u0007label\u001b]8;;\u0007");
  });
  it("strips esc characters from input", () => {
    expect(formatTerminalLink("\u001blabel", "\u001burl", { force: true })).toBe("\u001b]8;;url\u0007label\u001b]8;;\u0007");
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
