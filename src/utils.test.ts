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
  isPlainObject,
  isRecord,
  isSelfChatMode,
  jidToE164,
  normalizeE164,
  normalizePath,
  resolveConfigDir,
  resolveHomeDir,
  resolveJidToE164,
  resolveUserPath,
  safeParseJson,
  shortenHomeInString,
  shortenHomePath,
  sleep,
  sliceUtf16Safe,
  toWhatsappJid,
  truncateUtf16Safe,
  withWhatsAppPrefix,
} from "./utils.js";

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
    const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), "openclaw-test-"));
    const target = path.join(tmp, "nested", "dir");
    await ensureDir(target);
    expect(fs.existsSync(target)).toBe(true);
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
    const authDir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-auth-"));
    const mappingPath = path.join(authDir, "lid-mapping-456_reverse.json");
    fs.writeFileSync(mappingPath, JSON.stringify("5559876"));
    expect(jidToE164("456@lid", { authDir })).toBe("+5559876");
    fs.rmSync(authDir, { recursive: true, force: true });
  });

  it("maps @hosted.lid from authDir mapping files", () => {
    const authDir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-auth-"));
    const mappingPath = path.join(authDir, "lid-mapping-789_reverse.json");
    fs.writeFileSync(mappingPath, JSON.stringify(4440001));
    expect(jidToE164("789@hosted.lid", { authDir })).toBe("+4440001");
    fs.rmSync(authDir, { recursive: true, force: true });
  });

  it("accepts hosted PN JIDs", () => {
    expect(jidToE164("1555000:2@hosted")).toBe("+1555000");
  });

  it("falls back through lidMappingDirs in order", () => {
    const first = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-lid-a-"));
    const second = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-lid-b-"));
    const mappingPath = path.join(second, "lid-mapping-321_reverse.json");
    fs.writeFileSync(mappingPath, JSON.stringify("123321"));
    expect(jidToE164("321@lid", { lidMappingDirs: [first, second] })).toBe("+123321");
    fs.rmSync(first, { recursive: true, force: true });
    fs.rmSync(second, { recursive: true, force: true });
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
});

describe("clampNumber", () => {
  it("clamps value to min", () => {
    expect(clampNumber(0, 5, 10)).toBe(5);
  });
  it("clamps value to max", () => {
    expect(clampNumber(15, 5, 10)).toBe(10);
  });
  it("keeps value within range", () => {
    expect(clampNumber(7, 5, 10)).toBe(7);
  });
  it("is aliased as clamp", () => {
    expect(clamp(0, 5, 10)).toBe(5);
  });
});

describe("clampInt", () => {
  it("clamps and floors value", () => {
    expect(clampInt(4.9, 5, 10)).toBe(5); // 4.9 floors to 4, then clamps to 5
    expect(clampInt(7.9, 5, 10)).toBe(7); // 7.9 floors to 7
    expect(clampInt(10.1, 5, 10)).toBe(10); // 10.1 floors to 10
    expect(clampInt(15.9, 5, 10)).toBe(10);
  });
});

describe("escapeRegExp", () => {
  it("escapes special regex characters", () => {
    expect(escapeRegExp(".*+?^${}()|[]\\")).toBe("\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");
  });
  it("leaves normal strings alone", () => {
    expect(escapeRegExp("abc")).toBe("abc");
  });
});

describe("safeParseJson", () => {
  it("parses valid JSON", () => {
    expect(safeParseJson('{"a":1}')).toEqual({ a: 1 });
  });
  it("returns null for invalid JSON", () => {
    expect(safeParseJson("{a:1}")).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(safeParseJson("")).toBeNull();
  });
});

describe("isPlainObject", () => {
  it("returns true for plain objects", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });
  it("returns false for non-plain objects", () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(/abc/)).toBe(false);
    expect(isPlainObject("abc")).toBe(false);
    expect(isPlainObject(123)).toBe(false);
  });
});

describe("isRecord", () => {
  it("returns true for objects (less strict than isPlainObject)", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord(new Date())).toBe(true);
    expect(isRecord(/abc/)).toBe(true);
  });
  it("returns false for arrays and null", () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord("abc")).toBe(false);
  });
});

describe("isSelfChatMode", () => {
  it("returns false if selfE164 is missing", () => {
    expect(isSelfChatMode(null, ["+15551234567"])).toBe(false);
  });

  it("returns false if allowFrom is missing/empty", () => {
    expect(isSelfChatMode("+15551234567", null)).toBe(false);
    expect(isSelfChatMode("+15551234567", [])).toBe(false);
  });

  it("returns true if selfE164 matches an entry in allowFrom", () => {
    expect(isSelfChatMode("+15551234567", ["+15551234567"])).toBe(true);
    expect(isSelfChatMode("whatsapp:+15551234567", ["+15551234567"])).toBe(true);
    expect(isSelfChatMode("+15551234567", ["+15559999999", "+15551234567"])).toBe(true);
  });

  it("handles formatting differences", () => {
    expect(isSelfChatMode("+15551234567", ["+1 (555) 123-4567"])).toBe(true);
  });

  it("returns false if allowFrom contains wildcard * but no explicit match", () => {
    // The implementation specifically checks for * and returns false
    expect(isSelfChatMode("+15551234567", ["*"])).toBe(false);
  });
});

describe("sliceUtf16Safe", () => {
  it("slices normal strings correctly", () => {
    expect(sliceUtf16Safe("abcde", 1, 3)).toBe("bc");
  });

  it("handles start > end by swapping", () => {
    expect(sliceUtf16Safe("abcde", 3, 1)).toBe("bc");
  });

  it("does not split surrogate pairs", () => {
    const emoji = "😀"; // 2 chars: \ud83d \ude00
    const str = "a" + emoji + "b"; // length 4
    // Slicing right in the middle of the emoji
    // index 1 is high surrogate, index 2 is low surrogate
    // slice(1, 2) would normally return just the high surrogate
    // but sliceUtf16Safe should adjust
    expect(sliceUtf16Safe(str, 1, 2)).toBe(""); // Should be empty because it can't include half
    expect(sliceUtf16Safe(str, 1, 3)).toBe(emoji);
  });

  it("handles negative indices", () => {
    expect(sliceUtf16Safe("abcde", -2)).toBe("de");
  });
});

describe("truncateUtf16Safe", () => {
  it("truncates normal strings", () => {
    expect(truncateUtf16Safe("hello world", 5)).toBe("hello");
  });

  it("does not split surrogate pairs at boundary", () => {
    const emoji = "😀";
    const str = "hi" + emoji; // "hi" is 2 chars, emoji is 2 chars. total 4.
    // Truncate to 3 chars. Should stop before emoji because emoji takes 2 chars
    // and we can't fit it fully if we blindly slice.
    // Wait, let's trace logic:
    // slice(0, 3) -> "hi" + high surrogate
    // sliceUtf16Safe checks if end is between surrogates.
    // input[2] is high, input[3] is low.
    // to = 3. input[2] (before cut) is high, input[3] (after cut) is low.
    // So to -= 1 -> 2.
    // Returns "hi"
    expect(truncateUtf16Safe(str, 3)).toBe("hi");
  });

  it("returns original string if maxLen is sufficient", () => {
    expect(truncateUtf16Safe("abc", 5)).toBe("abc");
  });
});
