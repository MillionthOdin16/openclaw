import { describe, expect, it } from "vitest";
import {
  normalizePollDurationHours,
  normalizePollInput,
  resolvePollMaxSelections,
} from "./polls.js";

describe("polls", () => {
  describe("resolvePollMaxSelections", () => {
    it("returns 1 if allowMultiselect is falsy", () => {
      expect(resolvePollMaxSelections(5, false)).toBe(1);
      expect(resolvePollMaxSelections(5, undefined)).toBe(1);
    });

    it("returns max of 2 and optionCount if allowMultiselect is true", () => {
      expect(resolvePollMaxSelections(1, true)).toBe(2);
      expect(resolvePollMaxSelections(3, true)).toBe(3);
      expect(resolvePollMaxSelections(5, true)).toBe(5);
    });
  });

  describe("normalizePollInput", () => {
    it("requires a question", () => {
      expect(() => normalizePollInput({ question: "   ", options: ["a", "b"] })).toThrow(
        "Poll question is required"
      );
    });

    it("requires at least 2 options after filtering empty strings", () => {
      expect(() => normalizePollInput({ question: "Q?", options: ["a", "", "   "] })).toThrow(
        "Poll requires at least 2 options"
      );
    });

    it("enforces maxOptions if provided", () => {
      expect(() =>
        normalizePollInput(
          { question: "Q?", options: ["a", "b", "c"] },
          { maxOptions: 2 }
        )
      ).toThrow("Poll supports at most 2 options");
    });

    it("enforces maxSelections minimum", () => {
      expect(() =>
        normalizePollInput({ question: "Q?", options: ["a", "b"], maxSelections: 0 })
      ).toThrow("maxSelections must be at least 1");
    });

    it("enforces maxSelections maximum based on option count", () => {
      expect(() =>
        normalizePollInput({ question: "Q?", options: ["a", "b"], maxSelections: 3 })
      ).toThrow("maxSelections cannot exceed option count");
    });

    it("handles valid maxSelections", () => {
      const res = normalizePollInput({ question: "Q?", options: ["a", "b", "c"], maxSelections: 2.5 });
      expect(res.maxSelections).toBe(2);
    });

    it("defaults maxSelections to 1 if missing or invalid", () => {
      // @ts-expect-error - testing invalid input
      const res = normalizePollInput({ question: "Q?", options: ["a", "b"], maxSelections: "invalid" });
      expect(res.maxSelections).toBe(1);
    });

    it("enforces durationSeconds minimum", () => {
      expect(() =>
        normalizePollInput({ question: "Q?", options: ["a", "b"], durationSeconds: 0 })
      ).toThrow("durationSeconds must be at least 1");
    });

    it("handles valid durationSeconds", () => {
      const res = normalizePollInput({ question: "Q?", options: ["a", "b"], durationSeconds: 10.5 });
      expect(res.durationSeconds).toBe(10);
    });

    it("enforces durationHours minimum", () => {
      expect(() =>
        normalizePollInput({ question: "Q?", options: ["a", "b"], durationHours: 0 })
      ).toThrow("durationHours must be at least 1");
    });

    it("handles valid durationHours", () => {
      const res = normalizePollInput({ question: "Q?", options: ["a", "b"], durationHours: 5.5 });
      expect(res.durationHours).toBe(5);
    });

    it("throws if both durationSeconds and durationHours are provided", () => {
      expect(() =>
        normalizePollInput({
          question: "Q?",
          options: ["a", "b"],
          durationSeconds: 10,
          durationHours: 2,
        })
      ).toThrow("durationSeconds and durationHours are mutually exclusive");
    });

    it("returns normalized data", () => {
      const res = normalizePollInput({
        question: " Q? ",
        options: [" a ", " b ", ""],
      });
      expect(res.question).toBe("Q?");
      expect(res.options).toEqual(["a", "b"]);
      expect(res.maxSelections).toBe(1);
      expect(res.durationSeconds).toBeUndefined();
      expect(res.durationHours).toBeUndefined();
    });

    it("handles undefined options array", () => {
      expect(() =>
        normalizePollInput({ question: "Q?", options: undefined as unknown as string[] })
      ).toThrow("Poll requires at least 2 options");
    });
  });

  describe("normalizePollDurationHours", () => {
    it("uses value floored if valid number", () => {
      expect(normalizePollDurationHours(5.9, { defaultHours: 2, maxHours: 10 })).toBe(5);
    });

    it("uses defaultHours if value is missing or invalid", () => {
      expect(normalizePollDurationHours(undefined, { defaultHours: 2, maxHours: 10 })).toBe(2);
      expect(normalizePollDurationHours(NaN, { defaultHours: 2, maxHours: 10 })).toBe(2);
    });

    it("enforces minimum of 1", () => {
      expect(normalizePollDurationHours(-5, { defaultHours: 2, maxHours: 10 })).toBe(1);
    });

    it("enforces maxHours limit", () => {
      expect(normalizePollDurationHours(15, { defaultHours: 2, maxHours: 10 })).toBe(10);
    });
  });
});
