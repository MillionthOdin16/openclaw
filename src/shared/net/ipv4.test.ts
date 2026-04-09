import { describe, expect, it } from "vitest";
import { validateDottedDecimalIPv4Input, validateIPv4AddressInput } from "./ipv4.js";

describe("IPv4 validation helpers", () => {
  describe("validateDottedDecimalIPv4Input", () => {
    it("rejects empty or undefined values", () => {
      expect(validateDottedDecimalIPv4Input(undefined)).toBe("IP address is required for custom bind mode");
      expect(validateDottedDecimalIPv4Input("")).toBe("IP address is required for custom bind mode");
    });

    it("accepts valid canonical dotted decimal IPv4 addresses", () => {
      expect(validateDottedDecimalIPv4Input("192.168.1.100")).toBeUndefined();
      expect(validateDottedDecimalIPv4Input("127.0.0.1")).toBeUndefined();
      expect(validateDottedDecimalIPv4Input("0.0.0.0")).toBeUndefined();
      expect(validateDottedDecimalIPv4Input("255.255.255.255")).toBeUndefined();
    });

    it("rejects invalid IPv4 addresses", () => {
      expect(validateDottedDecimalIPv4Input("invalid")).toBe("Invalid IPv4 address (e.g., 192.168.1.100)");
      expect(validateDottedDecimalIPv4Input("256.256.256.256")).toBe("Invalid IPv4 address (e.g., 192.168.1.100)");
      expect(validateDottedDecimalIPv4Input("::1")).toBe("Invalid IPv4 address (e.g., 192.168.1.100)");
      expect(validateDottedDecimalIPv4Input("127.1")).toBe("Invalid IPv4 address (e.g., 192.168.1.100)");
      expect(validateDottedDecimalIPv4Input("0177.0.0.1")).toBe("Invalid IPv4 address (e.g., 192.168.1.100)");
    });
  });

  describe("validateIPv4AddressInput", () => {
    it("acts as a backward-compatible alias", () => {
      expect(validateIPv4AddressInput(undefined)).toBe("IP address is required for custom bind mode");
      expect(validateIPv4AddressInput("192.168.1.100")).toBeUndefined();
      expect(validateIPv4AddressInput("invalid")).toBe("Invalid IPv4 address (e.g., 192.168.1.100)");
    });
  });
});
