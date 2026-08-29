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

  it("throws when question is missing or empty", () => {
    expect(() => normalizePollInput({ question: "   ", options: ["A", "B"] })).toThrow(/question is required/);
  });

  it("throws when less than 2 options exist after cleaning", () => {
    expect(() => normalizePollInput({ question: "Q", options: ["A", " "] })).toThrow(/at least 2 options/);
  });

  it("handles default maxSelections and invalid inputs", () => {
    expect(normalizePollInput({ question: "Q", options: ["A", "B"] }).maxSelections).toBe(1);
    expect(normalizePollInput({ question: "Q", options: ["A", "B"], maxSelections: "invalid" as unknown }).maxSelections).toBe(1);
  });

  it("throws when maxSelections is less than 1 or exceeds options", () => {
    expect(() => normalizePollInput({ question: "Q", options: ["A", "B"], maxSelections: 0 })).toThrow(/at least 1/);
    expect(() => normalizePollInput({ question: "Q", options: ["A", "B"], maxSelections: 3 })).toThrow(/exceed option count/);
  });

  it("handles valid and invalid durationSeconds", () => {
    expect(normalizePollInput({ question: "Q", options: ["A", "B"], durationSeconds: 60 }).durationSeconds).toBe(60);
    expect(normalizePollInput({ question: "Q", options: ["A", "B"], durationSeconds: "invalid" as unknown }).durationSeconds).toBeUndefined();
    expect(() => normalizePollInput({ question: "Q", options: ["A", "B"], durationSeconds: 0 })).toThrow(/at least 1/);
  });

  it("handles valid and invalid durationHours", () => {
    expect(normalizePollInput({ question: "Q", options: ["A", "B"], durationHours: 24 }).durationHours).toBe(24);
    expect(normalizePollInput({ question: "Q", options: ["A", "B"], durationHours: "invalid" as unknown }).durationHours).toBeUndefined();
    expect(() => normalizePollInput({ question: "Q", options: ["A", "B"], durationHours: 0 })).toThrow(/at least 1/);
  });
});

describe("resolvePollMaxSelections", () => {
  it("returns 1 when multiselect is false or undefined", () => {
    expect(resolvePollMaxSelections(3, false)).toBe(1);
    expect(resolvePollMaxSelections(3, undefined)).toBe(1);
  });

  it("returns max(2, optionCount) when multiselect is true", () => {
    expect(resolvePollMaxSelections(1, true)).toBe(2);
    expect(resolvePollMaxSelections(3, true)).toBe(3);
  });
});
