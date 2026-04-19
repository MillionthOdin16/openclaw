import { describe, expect, it } from "vitest";
import { validateDottedDecimalIPv4Input, validateIPv4AddressInput } from "./ipv4.js";

describe("validateDottedDecimalIPv4Input", () => {
  it("returns an error message when input is undefined", () => {
    expect(validateDottedDecimalIPv4Input(undefined)).toBe("IP address is required for custom bind mode");
  });

  it("returns an error message when input is empty string", () => {
    expect(validateDottedDecimalIPv4Input("")).toBe("IP address is required for custom bind mode");
  });

  it("returns undefined when input is a valid dotted decimal IPv4", () => {
    expect(validateDottedDecimalIPv4Input("192.168.1.100")).toBeUndefined();
    expect(validateDottedDecimalIPv4Input("127.0.0.1")).toBeUndefined();
    expect(validateDottedDecimalIPv4Input("0.0.0.0")).toBeUndefined();
  });

  it("returns an error message when input is an invalid IPv4 address", () => {
    expect(validateDottedDecimalIPv4Input("invalid")).toBe("Invalid IPv4 address (e.g., 192.168.1.100)");
    expect(validateDottedDecimalIPv4Input("192.168.1.256")).toBe("Invalid IPv4 address (e.g., 192.168.1.100)");
    expect(validateDottedDecimalIPv4Input("192.168.1")).toBe("Invalid IPv4 address (e.g., 192.168.1.100)");
    expect(validateDottedDecimalIPv4Input("2001:db8::1")).toBe("Invalid IPv4 address (e.g., 192.168.1.100)");
    expect(validateDottedDecimalIPv4Input("0177.0.0.1")).toBe("Invalid IPv4 address (e.g., 192.168.1.100)"); // octal is invalid for canonical representation
  });
});

describe("validateIPv4AddressInput", () => {
  it("acts as an alias for validateDottedDecimalIPv4Input", () => {
    expect(validateIPv4AddressInput(undefined)).toBe("IP address is required for custom bind mode");
    expect(validateIPv4AddressInput("192.168.1.100")).toBeUndefined();
    expect(validateIPv4AddressInput("invalid")).toBe("Invalid IPv4 address (e.g., 192.168.1.100)");
  });
});
