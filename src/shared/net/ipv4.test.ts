import { describe, expect, it } from "vitest";
import { validateDottedDecimalIPv4Input, validateIPv4AddressInput } from "./ipv4.js";

describe("validateDottedDecimalIPv4Input", () => {
  it("returns error for falsy inputs", () => {
    expect(validateDottedDecimalIPv4Input(undefined)).toBe(
      "IP address is required for custom bind mode",
    );
    expect(validateDottedDecimalIPv4Input("")).toBe("IP address is required for custom bind mode");
  });

  it("returns undefined for valid canonical dotted decimal IPv4 inputs", () => {
    expect(validateDottedDecimalIPv4Input("192.168.1.100")).toBeUndefined();
    expect(validateDottedDecimalIPv4Input("0.0.0.0")).toBeUndefined();
    expect(validateDottedDecimalIPv4Input("127.0.0.1")).toBeUndefined();
    expect(validateDottedDecimalIPv4Input("255.255.255.255")).toBeUndefined();
  });

  it("returns error for invalid inputs", () => {
    const expectedError = "Invalid IPv4 address (e.g., 192.168.1.100)";
    expect(validateDottedDecimalIPv4Input("::1")).toBe(expectedError);
    expect(validateDottedDecimalIPv4Input("256.256.256.256")).toBe(expectedError);
    expect(validateDottedDecimalIPv4Input("abc")).toBe(expectedError);
    expect(validateDottedDecimalIPv4Input("0x7f.0.0.1")).toBe(expectedError);
    expect(validateDottedDecimalIPv4Input("192.168.1")).toBe(expectedError);
    expect(validateDottedDecimalIPv4Input("192.168.1.100.5")).toBe(expectedError);
  });
});

describe("validateIPv4AddressInput alias", () => {
  it("behaves identical to validateDottedDecimalIPv4Input", () => {
    expect(validateIPv4AddressInput(undefined)).toBe("IP address is required for custom bind mode");
    expect(validateIPv4AddressInput("192.168.1.100")).toBeUndefined();
    expect(validateIPv4AddressInput("::1")).toBe("Invalid IPv4 address (e.g., 192.168.1.100)");
  });
});
