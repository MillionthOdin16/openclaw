import { afterEach, describe, expect, it, vi } from "vitest";
import { createSessionSlug } from "./session-slug.js";

vi.mock("node:crypto", async (importOriginal) => {
  const original = await importOriginal<typeof import("node:crypto")>();
  return {
    ...original,
    randomInt: () => 0,
    randomBytes: (size: number) => Buffer.alloc(size, 0)
  };
});

describe("session slug", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates a two-word slug by default", () => {
    const slug = createSessionSlug();
    expect(slug).toBe("amber-atlas");
  });

  it("adds a numeric suffix when the base slug is taken", () => {
    const slug = createSessionSlug((id) => id === "amber-atlas");
    expect(slug).toBe("amber-atlas-2");
  });

  it("falls back to three words when collisions persist", () => {
    const slug = createSessionSlug((id) => /^amber-atlas(-\d+)?$/.test(id));
    expect(slug).toBe("amber-atlas-atlas");
  });
});
