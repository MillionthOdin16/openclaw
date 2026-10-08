import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertWebChannel,
  CONFIG_DIR,
  displayPath,
  displayString,
  ensureDir,
  formatTerminalLink,
  jidToE164,
  normalizeE164,
  normalizePath,
  resolveConfigDir,
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

describe("sliceUtf16Safe & truncateUtf16Safe", () => {
  it("truncates safe", () => {
    expect(truncateUtf16Safe("hello", 3)).toBe("hel");
    expect(truncateUtf16Safe("hello", 10)).toBe("hello");
  });

  it("slice safe", () => {
    const emoji = "😃";
    // If the end cuts a surrogate pair, it adjusts to not break the character
    expect(sliceUtf16Safe(emoji + " test", 0, 1)).toBe("");
    expect(sliceUtf16Safe("test " + emoji, 5, 6)).toBe("");

    // Normal cases
    expect(sliceUtf16Safe("test", -2)).toBe("st");
    expect(sliceUtf16Safe("test", 10)).toBe("");
    expect(sliceUtf16Safe("test", 0, 10)).toBe("test");
    expect(sliceUtf16Safe("test", 3, 1)).toBe("es");
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

describe("displayPath & displayString", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("displayPath calls shortenHomePath", () => {
    vi.stubEnv("OPENCLAW_HOME", "/srv/openclaw-home");
    expect(displayPath("/srv/openclaw-home/foo")).toBe("$OPENCLAW_HOME/foo");
  });

  it("displayString calls shortenHomeInString", () => {
    vi.stubEnv("OPENCLAW_HOME", "/srv/openclaw-home");
    expect(displayString("path: /srv/openclaw-home/foo")).toBe("path: $OPENCLAW_HOME/foo");
  });
});

describe("shortenHomePath edge cases", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns prefix when input is exactly home", () => {
    vi.stubEnv("OPENCLAW_HOME", "/srv/openclaw-home");
    expect(shortenHomePath("/srv/openclaw-home")).toBe("$OPENCLAW_HOME");
  });

  it("returns original input when input does not start with home", () => {
    vi.stubEnv("OPENCLAW_HOME", "/srv/openclaw-home");
    expect(shortenHomePath("/other/path")).toBe("/other/path");
  });

  it("handles empty input", () => {
    expect(shortenHomePath("")).toBe("");
  });
});

describe("shortenHomeInString edge cases", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns empty input as is", () => {
    expect(shortenHomeInString("")).toBe("");
  });

  it("returns original input when home cannot be resolved", () => {
    vi.stubEnv("HOME", "");
    vi.stubEnv("OPENCLAW_HOME", "");
    expect(shortenHomeInString("some string")).toBe("some string");
  });
});

describe("formatTerminalLink", () => {
  it("formats terminal link with TTY enabled by force flag", () => {
    expect(formatTerminalLink("My Link", "https://example.com", { force: true })).toBe(
      "\u001b]8;;https://example.com\u0007My Link\u001b]8;;\u0007",
    );
  });

  it("formats terminal link with fallback when force is false", () => {
    expect(formatTerminalLink("My Link", "https://example.com", { force: false })).toBe(
      "My Link (https://example.com)",
    );
  });

  it("formats terminal link with custom fallback", () => {
    expect(
      formatTerminalLink("My Link", "https://example.com", {
        force: false,
        fallback: "Custom Fallback",
      }),
    ).toBe("Custom Fallback");
  });

  it("removes escape characters from label and url", () => {
    expect(formatTerminalLink("My\u001bLink", "https://\u001bexample.com", { force: true })).toBe(
      "\u001b]8;;https://example.com\u0007MyLink\u001b]8;;\u0007",
    );
  });

  it("formats terminal link without opts based on TTY", () => {
    const isTTY = Boolean(process.stdout.isTTY);
    const link = formatTerminalLink("Test", "https://test.com");
    if (isTTY) {
      expect(link).toBe("\u001b]8;;https://test.com\u0007Test\u001b]8;;\u0007");
    } else {
      expect(link).toBe("Test (https://test.com)");
    }
  });
});
