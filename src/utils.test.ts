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
  jidToE164,
  normalizeE164,
  normalizePath,
  resolveConfigDir,
  resolveHomeDir,
  escapeRegExp,
  isRecord,
  isSelfChatMode,
  resolveJidToE164,
  resolveUserPath,
  safeParseJson,
  shortenHomeInString,
  shortenHomePath,
  sleep,
  toWhatsappJid,
  withWhatsAppPrefix,
} from "./utils.js";

describe("clampNumber", () => {
  it("clamps below min", () => {
    expect(clampNumber(5, 10, 20)).toBe(10);
  });
  it("clamps above max", () => {
    expect(clampNumber(25, 10, 20)).toBe(20);
  });
  it("leaves value within range", () => {
    expect(clampNumber(15, 10, 20)).toBe(15);
  });
});

describe("clampInt", () => {
  it("floors and clamps", () => {
    expect(clampInt(15.7, 10, 20)).toBe(15);
  });
});

describe("escapeRegExp", () => {
  it("escapes special characters", () => {
    expect(escapeRegExp(".*+?^${}()|[]\\")).toBe("\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");
  });
});

describe("safeParseJson", () => {
  it("parses valid json", () => {
    expect(safeParseJson('{"a": 1}')).toEqual({ a: 1 });
  });
  it("returns null for invalid json", () => {
    expect(safeParseJson("{a: 1}")).toBeNull();
  });
});

describe("isRecord", () => {
  it("returns true for objects", () => {
    expect(isRecord({ a: 1 })).toBe(true);
  });
  it("returns false for arrays", () => {
    expect(isRecord([1, 2, 3])).toBe(false);
  });
  it("returns false for null", () => {
    expect(isRecord(null)).toBe(false);
  });
  it("returns false for primitives", () => {
    expect(isRecord("string")).toBe(false);
  });
});

describe("isSelfChatMode", () => {
  it("returns false if selfE164 is null", () => {
    expect(isSelfChatMode(null, ["+15551234567"])).toBe(false);
  });
  it("returns false if allowFrom is empty or not an array", () => {
    expect(isSelfChatMode("+15551234567", [])).toBe(false);
    expect(isSelfChatMode("+15551234567", null)).toBe(false);
  });
  it("returns false for wildcard allowFrom", () => {
    expect(isSelfChatMode("+15551234567", ["*"])).toBe(false);
  });
  it("returns true if selfE164 is in allowFrom", () => {
    expect(isSelfChatMode("+15551234567", ["+15551234567"])).toBe(true);
  });
  it("normalizes and returns true if selfE164 matches allowFrom", () => {
    expect(isSelfChatMode("+15551234567", ["whatsapp:+15551234567"])).toBe(true);
    expect(isSelfChatMode("whatsapp:+15551234567", ["+15551234567"])).toBe(true);
  });
  it("returns false if unparseable number in allowFrom", () => {
    expect(isSelfChatMode("+15551234567", ["not a number"])).toBe(false);
  });
});

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

describe("clamp", () => {
  it("acts as alias to clampNumber", async () => {
    const { clamp } = await import("./utils.ts");
    expect(clamp(5, 10, 20)).toBe(10);
  });
});

describe("displayPath and displayString", () => {
  it("shortens home path for display", async () => {
    const { displayPath, displayString } = await import("./utils.ts");
    vi.stubEnv("OPENCLAW_HOME", "/srv/openclaw-home");
    expect(displayPath("/srv/openclaw-home/.openclaw")).toBe("$OPENCLAW_HOME/.openclaw");
    expect(displayString("File at /srv/openclaw-home/.openclaw")).toBe(
      "File at $OPENCLAW_HOME/.openclaw",
    );
    vi.unstubAllEnvs();
  });
});

describe("formatTerminalLink", () => {
  it("formats terminal link correctly", async () => {
    const { formatTerminalLink } = await import("./utils.ts");
    expect(formatTerminalLink("Click here", "https://example.com", { force: true })).toBe(
      "\u001b]8;;https://example.com\u0007Click here\u001b]8;;\u0007",
    );
  });
  it("returns fallback if not forced and not TTY", async () => {
    const { formatTerminalLink } = await import("./utils.ts");
    expect(formatTerminalLink("Click here", "https://example.com", { force: false })).toBe(
      "Click here (https://example.com)",
    );
  });
});

describe("shortenHomePath edge cases", () => {
  it("returns original input when empty", async () => {
    const { shortenHomePath } = await import("./utils.ts");
    expect(shortenHomePath("")).toBe("");
  });
  it("returns original input when OPENCLAW_HOME is not set and no OS homedir", async () => {
    const { shortenHomePath } = await import("./utils.ts");
    vi.stubEnv("HOME", "");
    vi.stubEnv("OPENCLAW_HOME", "");
    // mock os.homedir to return empty or we'd need to mock the full resolution flow
    // we just test it doesn't fail. The core logic falls back to undefined home.
    expect(shortenHomePath("/some/path")).toBe("/some/path");
    vi.unstubAllEnvs();
  });
  it("handles exact match for home", async () => {
    const { shortenHomePath } = await import("./utils.ts");
    vi.stubEnv("OPENCLAW_HOME", "/srv/openclaw-home");
    expect(shortenHomePath("/srv/openclaw-home")).toBe("$OPENCLAW_HOME");
    vi.unstubAllEnvs();
  });
  it("returns original input when it doesn't start with home/", async () => {
    const { shortenHomePath } = await import("./utils.ts");
    vi.stubEnv("OPENCLAW_HOME", "/srv/openclaw-home");
    expect(shortenHomePath("/srv/other-path")).toBe("/srv/other-path");
    vi.unstubAllEnvs();
  });
});

describe("shortenHomeInString edge cases", () => {
  it("returns original input when empty", async () => {
    const { shortenHomeInString } = await import("./utils.ts");
    expect(shortenHomeInString("")).toBe("");
  });
  it("returns original input when OPENCLAW_HOME is not set and no OS homedir", async () => {
    const { shortenHomeInString } = await import("./utils.ts");
    vi.stubEnv("HOME", "");
    vi.stubEnv("OPENCLAW_HOME", "");
    expect(shortenHomeInString("string with /some/path")).toBe("string with /some/path");
    vi.unstubAllEnvs();
  });
});

describe("sliceUtf16Safe and truncateUtf16Safe", () => {
  const surrogateString = "a\uD83D\uDE00b"; // "a😀b" where 😀 is a surrogate pair

  it("sliceUtf16Safe slices normally when no surrogate pair splits", async () => {
    const { sliceUtf16Safe } = await import("./utils.ts");
    expect(sliceUtf16Safe("abc", 0, 2)).toBe("ab");
  });

  it("sliceUtf16Safe shifts start index if it splits a surrogate pair", async () => {
    const { sliceUtf16Safe } = await import("./utils.ts");
    // "a😀b" length is 4 (1 for 'a', 2 for '😀', 1 for 'b')
    // index 2 points to the low surrogate of '😀'
    // it should shift to index 3 (the 'b')
    expect(sliceUtf16Safe(surrogateString, 2, 4)).toBe("b");
  });

  it("sliceUtf16Safe shifts end index if it splits a surrogate pair", async () => {
    const { sliceUtf16Safe } = await import("./utils.ts");
    // index 2 points to low surrogate. End index at 2 means it splits the pair at the end
    // it should shift end to 1 (before '😀')
    expect(sliceUtf16Safe(surrogateString, 0, 2)).toBe("a");
  });

  it("sliceUtf16Safe handles negative indices and swapped start/end", async () => {
    const { sliceUtf16Safe } = await import("./utils.ts");
    expect(sliceUtf16Safe("abc", -1, -3)).toBe("ab");
    expect(sliceUtf16Safe("abc", 2, 0)).toBe("ab");
  });

  it("truncateUtf16Safe truncates normally without splitting pairs", async () => {
    const { truncateUtf16Safe } = await import("./utils.ts");
    expect(truncateUtf16Safe("abc", 2)).toBe("ab");
  });

  it("truncateUtf16Safe avoids splitting surrogate pairs", async () => {
    const { truncateUtf16Safe } = await import("./utils.ts");
    // 2 is right in the middle of the surrogate pair
    // so it should stop before it
    expect(truncateUtf16Safe(surrogateString, 2)).toBe("a");
  });

  it("truncateUtf16Safe returns whole string if shorter than limit", async () => {
    const { truncateUtf16Safe } = await import("./utils.ts");
    expect(truncateUtf16Safe("abc", 5)).toBe("abc");
  });
});
