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
  clamp,
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
  it("returns true if path exists", async () => {
    const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-test-exists-"));
    try {
      expect(await pathExists(testDir)).toBe(true);
    } finally {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
  it("returns false if path does not exist", async () => {
    expect(await pathExists("/does/not/exist/ever/123")).toBe(false);
  });
});

describe("clamp", () => {
  it("clamps number between min and max", () => {
    expect(clampNumber(5, 1, 10)).toBe(5);
    expect(clampNumber(0, 1, 10)).toBe(1);
    expect(clampNumber(15, 1, 10)).toBe(10);
    expect(clamp(5, 1, 10)).toBe(5);
  });
  it("clamps int between min and max", () => {
    expect(clampInt(5.5, 1, 10)).toBe(5);
    expect(clampInt(0.5, 1, 10)).toBe(1);
    expect(clampInt(15.5, 1, 10)).toBe(10);
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
  it("returns null on invalid json", () => {
    expect(safeParseJson('{"a": 1')).toBeNull();
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
    expect(isRecord("")).toBe(false);
    expect(isRecord(1)).toBe(false);
  });
});

describe("isSelfChatMode", () => {
  it("returns true when selfE164 is in allowFrom", () => {
    expect(isSelfChatMode("+15551234567", ["+15551234567"])).toBe(true);
    expect(isSelfChatMode("+15551234567", ["15551234567"])).toBe(true);
  });
  it("returns false when selfE164 is not in allowFrom", () => {
    expect(isSelfChatMode("+15551234567", ["+15559999999"])).toBe(false);
    expect(isSelfChatMode("+15551234567", [])).toBe(false);
    expect(isSelfChatMode(null, ["+15551234567"])).toBe(false);
  });
  it("returns false when allowFrom contains *", () => {
    expect(isSelfChatMode("+15551234567", ["*"])).toBe(false);
  });
});

describe("utf16 safe slicing", () => {
  it("slices string safely around surrogate pairs", () => {
    const str = "a👋b"; // a (1), 👋 (2), b (1) = length 4
    expect(sliceUtf16Safe(str, 0, 1)).toBe("a");
    expect(sliceUtf16Safe(str, 0, 2)).toBe("a"); // would split emoji, slices up to before it
    expect(sliceUtf16Safe(str, 0, 3)).toBe("a👋");
    expect(sliceUtf16Safe(str, 0, 4)).toBe("a👋b");
  });
  it("handles negative indices", () => {
     const str = "a👋b";
     expect(sliceUtf16Safe(str, -3, -1)).toBe("👋");
  });
  it("truncates string safely", () => {
    const str = "a👋b";
    expect(truncateUtf16Safe(str, 2)).toBe("a");
    expect(truncateUtf16Safe(str, 3)).toBe("a👋");
    expect(truncateUtf16Safe(str, 5)).toBe("a👋b");
  });
});

describe("display utilities", () => {
  it("displayPath uses shortenHomePath", () => {
    vi.stubEnv("OPENCLAW_HOME", "/srv/openclaw-home");
    vi.stubEnv("HOME", "/home/other");
    expect(displayPath(`${path.resolve("/srv/openclaw-home")}/.openclaw/openclaw.json`)).toBe(
      "$OPENCLAW_HOME/.openclaw/openclaw.json"
    );
    vi.unstubAllEnvs();
  });
  it("displayString uses shortenHomeInString", () => {
    vi.stubEnv("OPENCLAW_HOME", "/srv/openclaw-home");
    vi.stubEnv("HOME", "/home/other");
    expect(displayString(`config: ${path.resolve("/srv/openclaw-home")}/.openclaw/openclaw.json`)).toBe(
      "config: $OPENCLAW_HOME/.openclaw/openclaw.json"
    );
    vi.unstubAllEnvs();
  });
});

describe("formatTerminalLink", () => {
  it("formats link when forced", () => {
    expect(formatTerminalLink("label", "url", { force: true })).toBe("\u001b]8;;url\u0007label\u001b]8;;\u0007");
  });
  it("uses fallback when not allowed", () => {
    expect(formatTerminalLink("label", "url", { force: false })).toBe("label (url)");
    expect(formatTerminalLink("label", "url", { force: false, fallback: "custom fallback" })).toBe("custom fallback");
  });
  it("strips escape characters from input", () => {
    expect(formatTerminalLink("\u001blabel", "url", { force: false })).toBe("label (url)");
  });
});
