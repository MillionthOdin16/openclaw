import { describe, expect, it } from "vitest";
import { normalizePollDurationHours, normalizePollInput, resolvePollMaxSelections } from "./polls.js";

describe("polls", () => {
  it("resolves max selections based on allowMultiselect", () => {
    expect(resolvePollMaxSelections(3, true)).toBe(3);
    expect(resolvePollMaxSelections(1, true)).toBe(2);
    expect(resolvePollMaxSelections(5, false)).toBe(1);
    expect(resolvePollMaxSelections(3, undefined)).toBe(1);
  });

  it("normalizes question/options and validates maxSelections", () => {
    expect(
      normalizePollInput({
        question: "  Lunch? ",
        options: [" Pizza ", " ", "Sushi"],
        maxSelections: 2,
      }),
    ).toEqual({
      question: "Lunch?",
      options: ["Pizza", "Sushi"],
      maxSelections: 2,
      durationSeconds: undefined,
      durationHours: undefined,
    });
  });

  it("throws when poll question is empty", () => {
    expect(() => normalizePollInput({ question: "   ", options: ["A", "B"] })).toThrow(
      "Poll question is required",
    );
  });

  it("throws when poll has less than 2 valid options", () => {
    expect(() => normalizePollInput({ question: "Q", options: ["A", "  "] })).toThrow(
      "Poll requires at least 2 options",
    );
  });

  it("enforces max option count when configured", () => {
    expect(() =>
      normalizePollInput({ question: "Q", options: ["A", "B", "C"] }, { maxOptions: 2 }),
    ).toThrow(/at most 2/);
  });

  it("throws when maxSelections is less than 1", () => {
    expect(() =>
      normalizePollInput({ question: "Q", options: ["A", "B"], maxSelections: 0 }),
    ).toThrow("maxSelections must be at least 1");
  });

  it("throws when maxSelections exceeds option count", () => {
    expect(() =>
      normalizePollInput({ question: "Q", options: ["A", "B"], maxSelections: 3 }),
    ).toThrow("maxSelections cannot exceed option count");
  });

  it("throws when durationSeconds is less than 1", () => {
    expect(() =>
      normalizePollInput({ question: "Q", options: ["A", "B"], durationSeconds: 0 }),
    ).toThrow("durationSeconds must be at least 1");
  });

  it("throws when durationHours is less than 1", () => {
    expect(() =>
      normalizePollInput({ question: "Q", options: ["A", "B"], durationHours: 0 }),
    ).toThrow("durationHours must be at least 1");
  });

  it("handles missing options gracefully", () => {
    // Cast to unknown to test the fallback path since TS normally requires options
    expect(() =>
      normalizePollInput({ question: "Q", options: undefined as unknown as string[] }),
    ).toThrow("Poll requires at least 2 options");
  });

  it.each([
    { durationHours: undefined, expected: 24 },
    { durationHours: 999, expected: 48 },
    { durationHours: 1, expected: 1 },
  ])("clamps poll duration for $durationHours hours", ({ durationHours, expected }) => {
    expect(normalizePollDurationHours(durationHours, { defaultHours: 24, maxHours: 48 })).toBe(
      expected,
    );
  });

  it("rejects both durationSeconds and durationHours", () => {
    expect(() =>
      normalizePollInput({
        question: "Q",
        options: ["A", "B"],
        durationSeconds: 60,
        durationHours: 1,
      }),
    ).toThrow(/mutually exclusive/);
  });
});
