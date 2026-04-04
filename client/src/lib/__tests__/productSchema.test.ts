/**
 * Tests for productSchema utility.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  buildProductSchema,
  schemaToScriptTag,
  injectProductSchemas,
  removeProductSchemas,
} from "../productSchema";
import type { Alternative } from "@/data/alternatives";

// ============================================================================
// Test fixtures
// ============================================================================

const mockAlt: Alternative = {
  name: "Baby High Contrast Flash Cards",
  asin: "B08TEST001",
  price: "$12.99",
  rating: 4.5,
  reviewCount: 1234,
  amazonUrl: "https://www.amazon.com/dp/B08TEST001?tag=loveveryfans-20",
  imageUrl: "https://example.com/image.jpg",
  reasonEn: "Great high contrast cards for newborns",
  reasonCn: "适合新生儿的高对比度卡片",
};

const mockAltNoPrice: Alternative = {
  name: "Simple Rattle",
  asin: "B08TEST002",
  price: null,
  rating: null,
  reviewCount: null,
  amazonUrl: "https://www.amazon.com/dp/B08TEST002?tag=loveveryfans-20",
  reasonEn: "Simple rattle",
  reasonCn: "简单摇铃",
};

// ============================================================================
// buildProductSchema tests
// ============================================================================

describe("buildProductSchema", () => {
  it("generates correct @context and @type", () => {
    const schema = buildProductSchema(mockAlt, "High Contrast Cards");
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Product");
  });

  it("includes product name", () => {
    const schema = buildProductSchema(mockAlt, "High Contrast Cards");
    expect(schema.name).toBe("Baby High Contrast Flash Cards");
  });

  it("includes description from reasonEn", () => {
    const schema = buildProductSchema(mockAlt, "High Contrast Cards");
    expect(schema.description).toBe("Great high contrast cards for newborns");
  });

  it("uses toy name in description when reasonEn is missing", () => {
    const altNoReason = { ...mockAlt, reasonEn: "" };
    const schema = buildProductSchema(altNoReason, "High Contrast Cards");
    expect(schema.description).toContain("High Contrast Cards");
  });

  it("includes image URL when provided", () => {
    const schema = buildProductSchema(mockAlt, "High Contrast Cards");
    expect(schema.image).toBe("https://example.com/image.jpg");
  });

  it("omits image when not provided", () => {
    const schema = buildProductSchema(mockAltNoPrice, "Rattle");
    expect(schema.image).toBeUndefined();
  });

  it("includes offers with correct price", () => {
    const schema = buildProductSchema(mockAlt, "High Contrast Cards");
    expect(schema.offers).toBeDefined();
    expect(schema.offers!.price).toBe("12.99");
    expect(schema.offers!.priceCurrency).toBe("USD");
  });

  it("sets availability to InStock by default when price exists", () => {
    const schema = buildProductSchema(mockAlt, "High Contrast Cards", "in_stock");
    expect(schema.offers!.availability).toBe("https://schema.org/InStock");
  });

  it("sets availability to OutOfStock correctly", () => {
    const schema = buildProductSchema(mockAlt, "High Contrast Cards", "out_of_stock");
    expect(schema.offers!.availability).toBe("https://schema.org/OutOfStock");
  });

  it("sets availability to Discontinued correctly", () => {
    const schema = buildProductSchema(mockAlt, "High Contrast Cards", "discontinued");
    expect(schema.offers!.availability).toBe("https://schema.org/Discontinued");
  });

  it("includes aggregateRating when rating is provided", () => {
    const schema = buildProductSchema(mockAlt, "High Contrast Cards");
    expect(schema.aggregateRating).toBeDefined();
    expect(schema.aggregateRating!.ratingValue).toBe("4.5");
    expect(schema.aggregateRating!.reviewCount).toBe("1234");
    expect(schema.aggregateRating!.bestRating).toBe("5");
    expect(schema.aggregateRating!.worstRating).toBe("1");
  });

  it("omits aggregateRating when rating is null", () => {
    const schema = buildProductSchema(mockAltNoPrice, "Rattle");
    expect(schema.aggregateRating).toBeUndefined();
  });

  it("omits offers when price is null", () => {
    const schema = buildProductSchema(mockAltNoPrice, "Rattle");
    expect(schema.offers).toBeUndefined();
  });

  it("handles price with dollar sign", () => {
    const alt = { ...mockAlt, price: "$24.99" };
    const schema = buildProductSchema(alt, "Toy");
    expect(schema.offers!.price).toBe("24.99");
  });

  it("handles price as number string", () => {
    const alt = { ...mockAlt, price: "19.99" };
    const schema = buildProductSchema(alt, "Toy");
    expect(schema.offers!.price).toBe("19.99");
  });
});

// ============================================================================
// schemaToScriptTag tests
// ============================================================================

describe("schemaToScriptTag", () => {
  it("wraps schema in script tag with correct type", () => {
    const schema = buildProductSchema(mockAlt, "Cards");
    const tag = schemaToScriptTag(schema);
    expect(tag).toContain('<script type="application/ld+json">');
    expect(tag).toContain("</script>");
  });

  it("contains serialized JSON", () => {
    const schema = buildProductSchema(mockAlt, "Cards");
    const tag = schemaToScriptTag(schema);
    expect(tag).toContain('"@type":"Product"');
    expect(tag).toContain('"name":"Baby High Contrast Flash Cards"');
  });
});

// ============================================================================
// injectProductSchemas / removeProductSchemas tests
// ============================================================================

describe("injectProductSchemas", () => {
  const containerId = "test-container";

  afterEach(() => {
    removeProductSchemas(containerId);
  });

  it("injects schema scripts into document head", () => {
    injectProductSchemas([mockAlt], "High Contrast Cards", containerId);
    const scripts = document.querySelectorAll(
      `script[data-product-schema="${containerId}"]`
    );
    expect(scripts.length).toBe(1);
  });

  it("skips alternatives with no price and no rating", () => {
    injectProductSchemas([mockAltNoPrice], "Rattle", containerId);
    const scripts = document.querySelectorAll(
      `script[data-product-schema="${containerId}"]`
    );
    expect(scripts.length).toBe(0);
  });

  it("removes old schemas before injecting new ones", () => {
    injectProductSchemas([mockAlt], "Cards", containerId);
    injectProductSchemas([mockAlt], "Cards", containerId);
    const scripts = document.querySelectorAll(
      `script[data-product-schema="${containerId}"]`
    );
    expect(scripts.length).toBe(1);
  });

  it("injects multiple schemas for multiple alternatives", () => {
    const alt2 = { ...mockAlt, asin: "B08TEST003", name: "Another Product" };
    injectProductSchemas([mockAlt, alt2], "Cards", containerId);
    const scripts = document.querySelectorAll(
      `script[data-product-schema="${containerId}"]`
    );
    expect(scripts.length).toBe(2);
  });
});

describe("removeProductSchemas", () => {
  it("removes all schemas for the given container", () => {
    const containerId = "remove-test";
    injectProductSchemas([mockAlt], "Cards", containerId);
    removeProductSchemas(containerId);
    const scripts = document.querySelectorAll(
      `script[data-product-schema="${containerId}"]`
    );
    expect(scripts.length).toBe(0);
  });

  it("does not affect schemas from other containers", () => {
    const container1 = "container-1";
    const container2 = "container-2";
    injectProductSchemas([mockAlt], "Cards", container1);
    injectProductSchemas([mockAlt], "Cards", container2);
    removeProductSchemas(container1);

    const scripts1 = document.querySelectorAll(
      `script[data-product-schema="${container1}"]`
    );
    const scripts2 = document.querySelectorAll(
      `script[data-product-schema="${container2}"]`
    );
    expect(scripts1.length).toBe(0);
    expect(scripts2.length).toBe(1);

    // Cleanup
    removeProductSchemas(container2);
  });
});
