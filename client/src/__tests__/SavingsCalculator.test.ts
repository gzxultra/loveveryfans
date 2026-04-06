/**
 * Tests for SavingsCalculator utility functions.
 * Tests parsePrice, buildAmazonProductUrl, and the deprecated buildAmazonCartUrl shim.
 *
 * Background on Amazon cart link changes:
 *   The legacy /gp/aws/cart/add.html multi-item cart endpoint has been unreliable
 *   since at least 2020 (returns "Sorry, something went wrong" error pages).
 *   We now use individual /dp/{ASIN}?tag={TAG} product-page URLs, which are:
 *   - Officially documented by Amazon Associates
 *   - Reliably supported across all regions and product types
 *   - Not subject to the deprecation issues of the cart endpoint
 */

import { describe, it, expect } from "vitest";
import { parsePrice, buildAmazonProductUrl, buildAmazonCartUrl } from "@/components/SavingsCalculator";

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

  it("strips currency symbols and commas", () => {
    expect(parsePrice("$1,299.00")).toBeCloseTo(1299.0);
  });

  it("handles integer prices", () => {
    expect(parsePrice("15")).toBeCloseTo(15);
  });
});

// ---------------------------------------------------------------------------
// buildAmazonProductUrl — the new per-item URL builder
// ---------------------------------------------------------------------------

describe("buildAmazonProductUrl", () => {
  it("returns empty string for empty ASIN", () => {
    expect(buildAmazonProductUrl("")).toBe("");
  });

  it("returns empty string for whitespace-only ASIN", () => {
    expect(buildAmazonProductUrl("   ")).toBe("");
  });

  it("builds a /dp/ URL for a valid ASIN", () => {
    const url = buildAmazonProductUrl("B08XYZ123");
    expect(url).toContain("amazon.com");
    expect(url).toContain("/dp/B08XYZ123");
  });

  it("includes the affiliate tag parameter", () => {
    const url = buildAmazonProductUrl("B08XYZ123");
    expect(url).toContain("tag=loveveryfans-20");
  });

  it("uses https scheme", () => {
    const url = buildAmazonProductUrl("B001");
    expect(url.startsWith("https://")).toBe(true);
  });

  it("produces a valid URL that can be parsed by the URL constructor", () => {
    const url = buildAmazonProductUrl("B0BQXJX5GH");
    expect(() => new URL(url)).not.toThrow();
  });

  it("URL-encodes the ASIN", () => {
    // Standard ASINs are alphanumeric and safe, encoding should be idempotent
    const url = buildAmazonProductUrl("B0BQXJX5GH");
    expect(url).toContain("B0BQXJX5GH");
  });

  it("trims whitespace from ASIN", () => {
    const url = buildAmazonProductUrl("  B0BQXJX5GH  ");
    expect(url).toContain("/dp/B0BQXJX5GH");
  });

  it("does NOT use the deprecated /gp/aws/cart/add.html endpoint", () => {
    // Regression guard: the old multi-item cart endpoint is unreliable.
    const url = buildAmazonProductUrl("B001");
    expect(url).not.toContain("/gp/aws/cart/add.html");
  });

  it("does NOT require AssociateTag (product-page URLs use tag= only)", () => {
    // AssociateTag is only needed for the deprecated cart endpoint.
    // Standard product-page affiliate links use the `tag` parameter.
    const url = buildAmazonProductUrl("B001");
    expect(url).not.toContain("AssociateTag=");
  });
});

// ---------------------------------------------------------------------------
// buildAmazonCartUrl — backwards-compatibility shim
// ---------------------------------------------------------------------------

describe("buildAmazonCartUrl (backwards-compat shim)", () => {
  it("returns empty string for empty array", () => {
    expect(buildAmazonCartUrl([])).toBe("");
  });

  it("returns a valid Amazon URL for a single ASIN", () => {
    const url = buildAmazonCartUrl(["B08XYZ123"]);
    expect(url).toContain("amazon.com");
    expect(url).toContain("B08XYZ123");
  });

  it("returns a URL with the affiliate tag", () => {
    const url = buildAmazonCartUrl(["B001"]);
    expect(url).toContain("tag=loveveryfans-20");
  });

  it("uses https scheme", () => {
    const url = buildAmazonCartUrl(["B001"]);
    expect(url.startsWith("https://")).toBe(true);
  });

  it("produces a valid URL that can be parsed by the URL constructor", () => {
    const url = buildAmazonCartUrl(["B001", "B002"]);
    expect(() => new URL(url)).not.toThrow();
  });

  it("does NOT use the deprecated /gp/aws/cart/add.html endpoint", () => {
    // Regression guard: the old multi-item cart endpoint is unreliable.
    const url = buildAmazonCartUrl(["B001"]);
    expect(url).not.toContain("/gp/aws/cart/add.html");
  });
});
