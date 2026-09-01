import { describe, expect, it } from "vitest";
import { normalizePollDurationHours, normalizePollInput, resolvePollMaxSelections } from "./polls.js";

describe("polls", () => {
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

  it("enforces max option count when configured", () => {
    expect(() =>
      normalizePollInput({ question: "Q", options: ["A", "B", "C"] }, { maxOptions: 2 }),
    ).toThrow(/at most 2/);
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

  it("rejects empty questions", () => {
    expect(() => normalizePollInput({ question: "   ", options: ["A", "B"] })).toThrow("Poll question is required");
  });

  it("rejects when options length is less than 2 after cleaning", () => {
    expect(() => normalizePollInput({ question: "Q", options: ["A", "   "] })).toThrow("Poll requires at least 2 options");
  });

  it("rejects when maxSelections is less than 1", () => {
    expect(() => normalizePollInput({ question: "Q", options: ["A", "B"], maxSelections: 0 })).toThrow("maxSelections must be at least 1");
  });

  it("rejects when maxSelections exceeds option count", () => {
    expect(() => normalizePollInput({ question: "Q", options: ["A", "B"], maxSelections: 3 })).toThrow("maxSelections cannot exceed option count");
  });

  it("rejects when durationSeconds is less than 1", () => {
    expect(() => normalizePollInput({ question: "Q", options: ["A", "B"], durationSeconds: 0 })).toThrow("durationSeconds must be at least 1");
  });

  it("rejects when durationHours is less than 1", () => {
    expect(() => normalizePollInput({ question: "Q", options: ["A", "B"], durationHours: 0 })).toThrow("durationHours must be at least 1");
  });

  describe("resolvePollMaxSelections", () => {
    it("returns 1 when allowMultiselect is falsy", () => {
      expect(resolvePollMaxSelections(4, false)).toBe(1);
      expect(resolvePollMaxSelections(2, undefined)).toBe(1);
    });

    it("returns the max of 2 and optionCount when allowMultiselect is true", () => {
      expect(resolvePollMaxSelections(4, true)).toBe(4);
      expect(resolvePollMaxSelections(1, true)).toBe(2);
    });
  });
});
