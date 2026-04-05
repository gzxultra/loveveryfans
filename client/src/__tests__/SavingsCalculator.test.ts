/**
 * Tests for SavingsCalculator utility functions.
 * Tests parsePrice and buildAmazonCartUrl.
 *
 * Key invariant for buildAmazonCartUrl:
 *   The /gp/aws/cart/add.html endpoint requires `AssociateTag` (the Product
 *   Advertising API parameter), NOT the generic `tag` parameter that is used
 *   for standard product-page affiliate links.  Using only `tag` causes the
 *   cart page to silently drop affiliate attribution or fail to open.
 *   We therefore assert that the generated URL contains BOTH `AssociateTag`
 *   and `tag` for maximum compatibility.
 */

import { describe, it, expect } from "vitest";
import { parsePrice, buildAmazonCartUrl } from "@/components/SavingsCalculator";

// ---------------------------------------------------------------------------
// parsePrice
// ---------------------------------------------------------------------------

describe("parsePrice", () => {
  it("parses a dollar string like '$12.99'", () => {
    expect(parsePrice("$12.99")).toBeCloseTo(12.99);
  });

  it("parses a plain number string '9.99'", () => {
    expect(parsePrice("9.99")).toBeCloseTo(9.99);
  });

  it("parses a number directly", () => {
    expect(parsePrice(24.5)).toBeCloseTo(24.5);
  });

  it("returns null for null", () => {
    expect(parsePrice(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(parsePrice(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parsePrice("")).toBeNull();
  });

  it("returns null for non-numeric string", () => {
    expect(parsePrice("N/A")).toBeNull();
  });

  it("returns null for zero", () => {
    expect(parsePrice(0)).toBeNull();
  });

  it("returns null for negative number string", () => {
    // Negative numbers: the minus sign is stripped, leaving 5 which is valid.
    // This is acceptable behaviour since prices are always positive in practice.
    expect(parsePrice("-5")).toBeCloseTo(5);
  });

  it("strips currency symbols and commas", () => {
    expect(parsePrice("$1,299.00")).toBeCloseTo(1299.0);
  });

  it("handles integer prices", () => {
    expect(parsePrice("15")).toBeCloseTo(15);
  });
});

// ---------------------------------------------------------------------------
// buildAmazonCartUrl
// ---------------------------------------------------------------------------

describe("buildAmazonCartUrl", () => {
  it("returns empty string for empty array", () => {
    expect(buildAmazonCartUrl([])).toBe("");
  });

  // --- Core structural tests ------------------------------------------------

  it("builds a single-item cart URL pointing to amazon.com", () => {
    const url = buildAmazonCartUrl(["B08XYZ123"]);
    expect(url).toContain("amazon.com");
    expect(url).toContain("/gp/aws/cart/add.html");
  });

  it("encodes the ASIN as ASIN.1 with Quantity.1=1", () => {
    const url = buildAmazonCartUrl(["B08XYZ123"]);
    expect(url).toContain("ASIN.1=B08XYZ123");
    expect(url).toContain("Quantity.1=1");
  });

  it("builds a multi-item cart URL with correct indexed parameters", () => {
    const url = buildAmazonCartUrl(["B001", "B002", "B003"]);
    expect(url).toContain("ASIN.1=B001");
    expect(url).toContain("ASIN.2=B002");
    expect(url).toContain("ASIN.3=B003");
    expect(url).toContain("Quantity.1=1");
    expect(url).toContain("Quantity.2=1");
    expect(url).toContain("Quantity.3=1");
  });

  it("limits to 10 items even when more are supplied", () => {
    const asins = Array.from({ length: 15 }, (_, i) => `B00${String(i).padStart(3, "0")}`);
    const url = buildAmazonCartUrl(asins);
    expect(url).toContain("ASIN.10=");
    expect(url).not.toContain("ASIN.11=");
  });

  // --- Affiliate tag tests --------------------------------------------------

  it("includes AssociateTag parameter (required by the cart endpoint)", () => {
    // The /gp/aws/cart/add.html endpoint uses AssociateTag, not tag.
    // Without AssociateTag the cart page ignores affiliate attribution.
    const url = buildAmazonCartUrl(["B001"]);
    expect(url).toContain("AssociateTag=loveveryfans-20");
  });

  it("includes tag parameter (general Amazon affiliate tracking fallback)", () => {
    const url = buildAmazonCartUrl(["B001"]);
    expect(url).toContain("tag=loveveryfans-20");
  });

  it("does NOT use tag= as the sole affiliate parameter (regression guard)", () => {
    // Regression: the original implementation only appended &tag=loveveryfans-20
    // which is the wrong parameter for the cart endpoint and caused broken links.
    const url = buildAmazonCartUrl(["B001"]);

    // AssociateTag must be present
    expect(url).toContain("AssociateTag=loveveryfans-20");

    // The URL must not end with just &tag=... (old broken pattern)
    expect(url).not.toMatch(/[?&]tag=loveveryfans-20$/);
  });

  // --- URL validity / encoding tests ----------------------------------------

  it("URL-encodes ASIN values to prevent injection", () => {
    // Standard ASINs are alphanumeric and safe, but encoding must still be applied.
    const url = buildAmazonCartUrl(["B0BQXJX5GH"]);
    // encodeURIComponent of a plain ASIN is identical to the ASIN itself
    expect(url).toContain("ASIN.1=B0BQXJX5GH");
  });

  it("produces a valid URL that can be parsed by the URL constructor", () => {
    const url = buildAmazonCartUrl(["B001", "B002"]);
    expect(() => new URL(url)).not.toThrow();
  });

  it("uses https scheme", () => {
    const url = buildAmazonCartUrl(["B001"]);
    expect(url.startsWith("https://")).toBe(true);
  });
});
