import { describe, expect, it } from "vitest";

import { validateDottedDecimalIPv4Input, validateIPv4AddressInput } from "./ipv4.js";

describe("validateDottedDecimalIPv4Input", () => {
  it("returns required message for undefined input", () => {
    expect(validateDottedDecimalIPv4Input(undefined)).toBe(
      "IP address is required for custom bind mode",
    );
  });

  it("returns required message for empty string input", () => {
    expect(validateDottedDecimalIPv4Input("")).toBe(
      "IP address is required for custom bind mode",
    );
  });

  it("returns undefined for a valid IPv4 address", () => {
    expect(validateDottedDecimalIPv4Input("192.168.1.100")).toBeUndefined();
    expect(validateDottedDecimalIPv4Input("0.0.0.0")).toBeUndefined();
    expect(validateDottedDecimalIPv4Input("255.255.255.255")).toBeUndefined();
  });

  it("returns invalid message for an invalid IPv4 address", () => {
    expect(validateDottedDecimalIPv4Input("192.168.1")).toBe(
      "Invalid IPv4 address (e.g., 192.168.1.100)",
    );
    expect(validateDottedDecimalIPv4Input("192.168.1.256")).toBe(
      "Invalid IPv4 address (e.g., 192.168.1.100)",
    );
    expect(validateDottedDecimalIPv4Input("invalid-ip")).toBe(
      "Invalid IPv4 address (e.g., 192.168.1.100)",
    );
    // IPv6 addresses should be invalid for this specific IPv4 validator
    expect(validateDottedDecimalIPv4Input("::1")).toBe(
      "Invalid IPv4 address (e.g., 192.168.1.100)",
    );
  });
});

describe("validateIPv4AddressInput", () => {
  it("acts as an alias to validateDottedDecimalIPv4Input", () => {
    expect(validateIPv4AddressInput(undefined)).toBe(
      "IP address is required for custom bind mode",
    );
    expect(validateIPv4AddressInput("192.168.1.100")).toBeUndefined();
    expect(validateIPv4AddressInput("invalid-ip")).toBe(
      "Invalid IPv4 address (e.g., 192.168.1.100)",
    );
  });
});
