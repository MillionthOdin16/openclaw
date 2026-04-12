import ipaddr from "ipaddr.js";
import { describe, expect, it } from "vitest";
import { blockedIpv6MulticastLiterals } from "./ip-test-fixtures.js";
import {
  extractEmbeddedIpv4FromIpv6,
  isCanonicalDottedDecimalIPv4,
  isIpInCidr,
  isIpv6Address,
  isIpv4Address,
  isLegacyIpv4Literal,
  isPrivateOrLoopbackIpAddress,
  parseCanonicalIpAddress,
  parseLooseIpAddress,
  normalizeIpAddress,
  isLoopbackIpAddress,
  isRfc1918Ipv4Address,
  isCarrierGradeNatIpv4Address,
  isBlockedSpecialUseIpv4Address,
  isBlockedSpecialUseIpv6Address,
} from "./ip.js";

describe("shared ip helpers", () => {
  it("distinguishes canonical dotted IPv4 from legacy forms", () => {
    expect(isCanonicalDottedDecimalIPv4("127.0.0.1")).toBe(true);
    expect(isCanonicalDottedDecimalIPv4("0177.0.0.1")).toBe(false);
    expect(isLegacyIpv4Literal("0177.0.0.1")).toBe(true);
    expect(isLegacyIpv4Literal("127.1")).toBe(true);
    expect(isLegacyIpv4Literal("example.com")).toBe(false);
  });

  it("matches both IPv4 and IPv6 CIDRs", () => {
    expect(isIpInCidr("10.42.0.59", "10.42.0.0/24")).toBe(true);
    expect(isIpInCidr("10.43.0.59", "10.42.0.0/24")).toBe(false);
    expect(isIpInCidr("2001:db8::1234", "2001:db8::/32")).toBe(true);
    expect(isIpInCidr("2001:db9::1234", "2001:db8::/32")).toBe(false);
  });

  it("extracts embedded IPv4 for transition prefixes", () => {
    const cases = [
      ["::ffff:127.0.0.1", "127.0.0.1"],
      ["::127.0.0.1", "127.0.0.1"],
      ["64:ff9b::8.8.8.8", "8.8.8.8"],
      ["64:ff9b:1::10.0.0.1", "10.0.0.1"],
      ["2002:0808:0808::", "8.8.8.8"],
      ["2001::f7f7:f7f7", "8.8.8.8"],
      ["2001:4860:1::5efe:7f00:1", "127.0.0.1"],
    ] as const;
    for (const [ipv6Literal, expectedIpv4] of cases) {
      const parsed = parseCanonicalIpAddress(ipv6Literal);
      expect(parsed?.kind(), ipv6Literal).toBe("ipv6");
      if (!parsed || !isIpv6Address(parsed)) {
        continue;
      }
      expect(extractEmbeddedIpv4FromIpv6(parsed)?.toString(), ipv6Literal).toBe(expectedIpv4);
    }
  });

  it("treats blocked IPv6 classes as private/internal", () => {
    expect(isPrivateOrLoopbackIpAddress("fec0::1")).toBe(true);
    for (const literal of blockedIpv6MulticastLiterals) {
      expect(isPrivateOrLoopbackIpAddress(literal)).toBe(true);
    }
    expect(isPrivateOrLoopbackIpAddress("2001:4860:4860::8888")).toBe(false);
  });

  it("parses canonical IP addresses", () => {
    expect(parseCanonicalIpAddress("")).toBeUndefined();
    expect(parseCanonicalIpAddress("   ")).toBeUndefined();
    expect(parseCanonicalIpAddress("[::1]")).toBeDefined();
    expect(parseCanonicalIpAddress("[127.0.0.1]")).toBeDefined();
    expect(parseCanonicalIpAddress("127.0.0.1.5")).toBeUndefined();

    // IPv6 with embedded IPv4 parsing
    expect(parseCanonicalIpAddress("::ffff:127.0.0.1")).toBeDefined();
    expect(parseCanonicalIpAddress("invalid::127.0.0.1")).toBeUndefined();
    expect(parseCanonicalIpAddress("invalid_ipv6_with_v4")).toBeUndefined(); // no dot or colon
    expect(parseCanonicalIpAddress("1:2:3:invalid.127.0.0.1")).toBeUndefined(); // fails regex match
    expect(parseCanonicalIpAddress("1:2:3:4:5:6:7:8:127.0.0.1")).toBeUndefined(); // invalid v6 part with valid v4
    expect(parseCanonicalIpAddress("::ffff:127.0.0.1%eth0")).toBeDefined(); // zone suffix
    expect(parseCanonicalIpAddress("0177.0.0.1")).toBeUndefined(); // Valid IPv4 but not four-part decimal
    expect(parseCanonicalIpAddress("::ffff:256.0.0.1")).toBeUndefined();
    expect(parseCanonicalIpAddress("[]")).toBeUndefined(); // Strip brackets gives empty string
    expect(parseCanonicalIpAddress("::invalid.1.2.3")).toBeUndefined();
    expect(parseCanonicalIpAddress("::invalid:127.0.0.1")).toBeUndefined(); // fails regex because no dot in ipv4 part match or something similar // regex match fail
    expect(parseCanonicalIpAddress("2001:db8::192.168.0.1")).toBeDefined();
  });

  it("parses loose IP addresses", () => {
    expect(parseLooseIpAddress("")).toBeUndefined();
    expect(parseLooseIpAddress("   ")).toBeUndefined();
    expect(parseLooseIpAddress("127.0.0.1")).toBeDefined();
    expect(parseLooseIpAddress("[]")).toBeUndefined(); // Strip brackets gives empty string
    expect(parseLooseIpAddress("invalid::127.0.0.1")).toBeUndefined(); // invalid v6 with embedded v4
    expect(parseLooseIpAddress("[::1]")).toBeDefined();
    expect(parseLooseIpAddress("::ffff:127.0.0.1")).toBeDefined();
  });

  it("normalizes IP addresses", () => {
    expect(normalizeIpAddress("")).toBeUndefined();
    expect(normalizeIpAddress("127.0.0.1")).toBe("127.0.0.1");
    expect(normalizeIpAddress("::ffff:127.0.0.1")).toBe("127.0.0.1"); // mapped
    expect(normalizeIpAddress("::1")).toBe("::1");
  });

  it("checks canonical dotted decimal ipv4", () => {
    expect(isCanonicalDottedDecimalIPv4("")).toBe(false);
    expect(isCanonicalDottedDecimalIPv4("   ")).toBe(false);
    expect(isCanonicalDottedDecimalIPv4("[127.0.0.1]")).toBe(true);
    expect(isCanonicalDottedDecimalIPv4("[]")).toBe(false); // Empty after stripping brackets
  });

  it("checks legacy ipv4 literal edge cases", () => {
    expect(isLegacyIpv4Literal("")).toBe(false);
    expect(isLegacyIpv4Literal("  ")).toBe(false);
    expect(isLegacyIpv4Literal("::1")).toBe(false); // contains :
    expect(isLegacyIpv4Literal("127.0.0.1")).toBe(false); // canonical
    expect(isLegacyIpv4Literal("127")).toBe(true); // < 4 parts
    expect(isLegacyIpv4Literal("127.0.0.1.1")).toBe(false); // > 4 parts
    expect(isLegacyIpv4Literal("127..0.1")).toBe(false); // empty part
    expect(isLegacyIpv4Literal("127.0x.0.1")).toBe(false); // non-numeric
  });

  it("identifies ip version", () => {
    const v4 = parseCanonicalIpAddress("127.0.0.1")!;
    const v6 = parseCanonicalIpAddress("::1")!;
    expect(isIpv4Address(v4)).toBe(true);
    expect(isIpv4Address(v6)).toBe(false);
    expect(isIpv6Address(v6)).toBe(true);
    expect(isIpv6Address(v4)).toBe(false);
  });

  it("checks loopback ip addresses", () => {
    expect(isLoopbackIpAddress("")).toBe(false);
    expect(isLoopbackIpAddress("127.0.0.1")).toBe(true);
    expect(isLoopbackIpAddress("::1")).toBe(true);
    expect(isLoopbackIpAddress("8.8.8.8")).toBe(false);
  });

  it("checks private or loopback ip addresses", () => {
    expect(isPrivateOrLoopbackIpAddress("")).toBe(false);
    expect(isPrivateOrLoopbackIpAddress("10.0.0.1")).toBe(true); // private v4
    expect(isPrivateOrLoopbackIpAddress("::ffff:10.0.0.1")).toBe(true); // mapped private v4
    expect(isPrivateOrLoopbackIpAddress("8.8.8.8")).toBe(false); // public v4
  });

  it("checks blocked special use ipv6 addresses", () => {
    expect(isBlockedSpecialUseIpv6Address(ipaddr.IPv6.parse("2001:db8::1"))).toBe(false);
    expect(isBlockedSpecialUseIpv6Address(ipaddr.IPv6.parse("::"))).toBe(true); // unspecified
  });

  it("checks rfc1918 ipv4 addresses", () => {
    expect(isRfc1918Ipv4Address("")).toBe(false);
    expect(isRfc1918Ipv4Address("::1")).toBe(false);
    expect(isRfc1918Ipv4Address("10.0.0.1")).toBe(true);
    expect(isRfc1918Ipv4Address("8.8.8.8")).toBe(false);
  });

  it("checks carrier grade nat ipv4 addresses", () => {
    expect(isCarrierGradeNatIpv4Address("")).toBe(false);
    expect(isCarrierGradeNatIpv4Address("::1")).toBe(false);
    expect(isCarrierGradeNatIpv4Address("100.64.0.1")).toBe(true);
    expect(isCarrierGradeNatIpv4Address("8.8.8.8")).toBe(false);
  });

  it("checks blocked special use ipv4 addresses", () => {
    const rfc2544 = ipaddr.IPv4.parse("198.18.0.1");
    const broadcast = ipaddr.IPv4.parse("255.255.255.255");
    const publicIp = ipaddr.IPv4.parse("8.8.8.8");

    expect(isBlockedSpecialUseIpv4Address(rfc2544)).toBe(true);
    expect(isBlockedSpecialUseIpv4Address(rfc2544, { allowRfc2544BenchmarkRange: true })).toBe(
      false,
    );
    expect(isBlockedSpecialUseIpv4Address(broadcast)).toBe(true);
    expect(isBlockedSpecialUseIpv4Address(publicIp)).toBe(false);
  });

  it("extracts embedded ipv4 from ipv6 additional branches", () => {
    // rfc6145
    expect(extractEmbeddedIpv4FromIpv6(ipaddr.IPv6.parse("::ffff:0:192.0.2.47"))?.toString()).toBe(
      "192.0.2.47",
    );
    // rfc6052
    expect(extractEmbeddedIpv4FromIpv6(ipaddr.IPv6.parse("64:ff9b::192.0.2.33"))?.toString()).toBe(
      "192.0.2.33",
    );
    // fallback
    expect(extractEmbeddedIpv4FromIpv6(ipaddr.IPv6.parse("2001:db8::1"))).toBeUndefined();
    // mapped case is already implicitly tested in parseCanonicalIpAddress mapped case above, but let's do it directly
    expect(extractEmbeddedIpv4FromIpv6(ipaddr.IPv6.parse("::192.168.0.1"))?.toString()).toBe(
      "192.168.0.1",
    ); // IPv4-compatible (parts 0-5 are 0)
    expect(extractEmbeddedIpv4FromIpv6(ipaddr.IPv6.parse("2002:0a00:0001::"))?.toString()).toBe(
      "10.0.0.1",
    ); // 6to4 prefix
    expect(extractEmbeddedIpv4FromIpv6(ipaddr.IPv6.parse("::192.168.1.1"))?.toString()).toBe(
      "192.168.1.1",
    ); // ::w.x.y.z format hits line 50 rule
    expect(
      extractEmbeddedIpv4FromIpv6(ipaddr.IPv6.parse("0:0:0:0:0:0:192.168.1.1"))?.toString(),
    ).toBe("192.168.1.1");
  });

  it("checks if IP is in CIDR edge cases", () => {
    expect(isIpInCidr("invalid", "10.0.0.0/24")).toBe(false);
    expect(isIpInCidr("10.0.0.1", "")).toBe(false);
    expect(isIpInCidr("10.0.0.1", "  ")).toBe(false);

    // Exact match (no /)
    expect(isIpInCidr("10.0.0.1", "10.0.0.1")).toBe(true);
    expect(isIpInCidr("10.0.0.1", "10.0.0.2")).toBe(false);
    expect(isIpInCidr("10.0.0.1", "invalid")).toBe(false);
    expect(isIpInCidr("10.0.0.1", "::1")).toBe(false); // v4 vs v6

    // Invalid CIDR parsing
    expect(isIpInCidr("10.0.0.1", "10.0.0.0/invalid")).toBe(false);

    // v4 vs v6 mismatch in CIDR
    expect(isIpInCidr("10.0.0.1", "2001:db8::/32")).toBe(false);
    expect(isIpInCidr("::1", "10.0.0.0/24")).toBe(false);

    // IP matching but throws error in match() (simulate with invalid prefix)
    expect(isIpInCidr("10.0.0.1", "10.0.0.0/999")).toBe(false);
  });
});
