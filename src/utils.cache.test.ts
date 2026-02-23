import fs from "node:fs";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { jidToE164 } from "./utils.js";

describe("jidToE164 caching", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("caches the result of readLidReverseMapping", () => {
    const lid = "111";
    const mappingFilename = `lid-mapping-${lid}_reverse.json`;
    const expectedPhone = "+111111";

    // Mock fs.readFileSync to return the phone number when the filename matches
    const readFileSyncSpy = vi.spyOn(fs, "readFileSync").mockImplementation((p) => {
      if (typeof p === "string" && p.includes(mappingFilename)) {
        return JSON.stringify(expectedPhone);
      }
      // Throw for other files to simulate "not found" or irrelevant
      throw new Error("ENOENT");
    });

    // First call
    const result1 = jidToE164(`${lid}@lid`);
    expect(result1).toBe(expectedPhone);
    const callsAfterFirst = readFileSyncSpy.mock.calls.length;
    expect(callsAfterFirst).toBeGreaterThan(0);

    // Second call - should be cached
    const result2 = jidToE164(`${lid}@lid`);
    expect(result2).toBe(expectedPhone);
    const callsAfterSecond = readFileSyncSpy.mock.calls.length;
    expect(callsAfterSecond).toBe(callsAfterFirst);
  });

  it("bypasses cache when options are provided", () => {
    const lid = "222";
    const mappingFilename = `lid-mapping-${lid}_reverse.json`;
    const expectedPhone = "+222222";
    const authDir = "/tmp/auth";

    const readFileSyncSpy = vi.spyOn(fs, "readFileSync").mockImplementation((p) => {
      if (typeof p === "string" && p.includes(mappingFilename)) {
        return JSON.stringify(expectedPhone);
      }
      throw new Error("ENOENT");
    });

    // First call with opts
    jidToE164(`${lid}@lid`, { authDir });
    const callsAfterFirst = readFileSyncSpy.mock.calls.length;
    expect(callsAfterFirst).toBeGreaterThan(0);

    // Second call with opts
    jidToE164(`${lid}@lid`, { authDir });
    const callsAfterSecond = readFileSyncSpy.mock.calls.length;
    expect(callsAfterSecond).toBeGreaterThan(callsAfterFirst);
  });

  it("refreshes cache after TTL", () => {
    const lid = "333";
    const mappingFilename = `lid-mapping-${lid}_reverse.json`;
    const expectedPhone = "+333333";

    const readFileSyncSpy = vi.spyOn(fs, "readFileSync").mockImplementation((p) => {
      if (typeof p === "string" && p.includes(mappingFilename)) {
        return JSON.stringify(expectedPhone);
      }
      throw new Error("ENOENT");
    });

    // First call
    jidToE164(`${lid}@lid`);
    const callsAfterFirst = readFileSyncSpy.mock.calls.length;

    // Advance time > 60s
    vi.advanceTimersByTime(60001);

    // Second call
    jidToE164(`${lid}@lid`);
    const callsAfterSecond = readFileSyncSpy.mock.calls.length;
    expect(callsAfterSecond).toBeGreaterThan(callsAfterFirst);
  });

  it("caches negative results (null)", () => {
    const lid = "444";
    // Ensure filename is unique to avoid collision with other tests if cache is shared (it is)
    const mappingFilename = `lid-mapping-${lid}_reverse.json`;

    const readFileSyncSpy = vi.spyOn(fs, "readFileSync").mockImplementation((p) => {
      // Always throw for this LID
      if (typeof p === "string" && p.includes(mappingFilename)) {
        throw new Error("ENOENT");
      }
      throw new Error("ENOENT");
    });

    // First call
    const result1 = jidToE164(`${lid}@lid`);
    expect(result1).toBeNull();
    const callsAfterFirst = readFileSyncSpy.mock.calls.length;
    expect(callsAfterFirst).toBeGreaterThan(0);

    // Second call
    const result2 = jidToE164(`${lid}@lid`);
    expect(result2).toBeNull();
    const callsAfterSecond = readFileSyncSpy.mock.calls.length;
    expect(callsAfterSecond).toBe(callsAfterFirst); // Should be cached
  });
});
