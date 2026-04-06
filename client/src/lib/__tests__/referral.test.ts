/**
 * Tests for referral URL utilities
 */

import { describe, it, expect } from "vitest";
import {
  REFERRAL_CODE,
  AMAZON_AFFILIATE_TAG,
  appendLoveveryReferral,
  getKitPurchaseUrl,
  getReferralProgramUrl,
  getProductPurchaseUrl,
  ensureAmazonTag,
} from "../referral";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("Referral constants", () => {
  it("has the correct referral code", () => {
    expect(REFERRAL_CODE).toBe("REF-6AA44A5A");
  });

  it("has the correct Amazon affiliate tag", () => {
    expect(AMAZON_AFFILIATE_TAG).toBe("loveveryfans-20");
  });
});

// ---------------------------------------------------------------------------
// appendLoveveryReferral
// ---------------------------------------------------------------------------

describe("appendLoveveryReferral", () => {
  it("adds referral code to a simple lovevery.com URL", () => {
    const url = appendLoveveryReferral("https://lovevery.com/products/the-play-kits");
    expect(url).toContain("discount_code=REF-6AA44A5A");
    expect(url).toContain("utm_source=loveveryfans");
    expect(url).toContain("utm_medium=referral");
  });

  it("uses the provided campaign name", () => {
    const url = appendLoveveryReferral("https://lovevery.com/products/the-play-kits", "kit_explorer");
    expect(url).toContain("utm_campaign=kit_explorer");
  });

  it("defaults to 'general' campaign", () => {
    const url = appendLoveveryReferral("https://lovevery.com/products/the-play-kits");
    expect(url).toContain("utm_campaign=general");
  });

  it("does not modify non-lovevery URLs", () => {
    const url = "https://example.com/page";
    expect(appendLoveveryReferral(url)).toBe(url);
  });

  it("replaces existing discount_code", () => {
    const url = appendLoveveryReferral("https://lovevery.com/products?discount_code=OLD");
    expect(url).toContain("discount_code=REF-6AA44A5A");
    expect(url).not.toContain("discount_code=OLD");
  });

  it("handles URLs that already have query parameters", () => {
    const url = appendLoveveryReferral("https://lovevery.com/products?color=blue");
    expect(url).toContain("color=blue");
    expect(url).toContain("discount_code=REF-6AA44A5A");
  });

  it("does not duplicate utm params", () => {
    const url = appendLoveveryReferral(
      "https://lovevery.com/products?utm_source=old&utm_medium=old&utm_campaign=old"
    );
    const matches = url.match(/utm_source/g);
    expect(matches).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// getKitPurchaseUrl
// ---------------------------------------------------------------------------

describe("getKitPurchaseUrl", () => {
  it("returns a URL with the kit slug", () => {
    const url = getKitPurchaseUrl("explorer");
    expect(url).toContain("the-play-kits-the-explorer");
  });

  it("includes the referral code", () => {
    const url = getKitPurchaseUrl("explorer");
    expect(url).toContain("discount_code=REF-6AA44A5A");
  });

  it("includes the kit campaign", () => {
    const url = getKitPurchaseUrl("explorer");
    expect(url).toContain("utm_campaign=kit_explorer");
  });
});

// ---------------------------------------------------------------------------
// getReferralProgramUrl
// ---------------------------------------------------------------------------

describe("getReferralProgramUrl", () => {
  it("returns a URL to the refer-a-friend page", () => {
    const url = getReferralProgramUrl();
    expect(url).toContain("lovevery.com/pages/refer-a-friend");
  });

  it("includes the referral code", () => {
    const url = getReferralProgramUrl();
    expect(url).toContain("discount_code=REF-6AA44A5A");
  });

  it("includes the refer_friend campaign", () => {
    const url = getReferralProgramUrl();
    expect(url).toContain("utm_campaign=refer_friend");
  });
});

// ---------------------------------------------------------------------------
// getProductPurchaseUrl
// ---------------------------------------------------------------------------

describe("getProductPurchaseUrl", () => {
  it("returns a URL with the referral code", () => {
    const url = getProductPurchaseUrl("music-set", "https://lovevery.com/products/the-music-set");
    expect(url).toContain("discount_code=REF-6AA44A5A");
  });

  it("includes the product campaign", () => {
    const url = getProductPurchaseUrl("music-set", "https://lovevery.com/products/the-music-set");
    expect(url).toContain("utm_campaign=product_music-set");
  });
});

// ---------------------------------------------------------------------------
// ensureAmazonTag
// ---------------------------------------------------------------------------

describe("ensureAmazonTag", () => {
  it("adds the affiliate tag to a bare Amazon URL", () => {
    const url = ensureAmazonTag("https://www.amazon.com/dp/B0BQXJX5GH");
    expect(url).toContain("tag=loveveryfans-20");
  });

  it("does not duplicate existing correct tag", () => {
    const url = ensureAmazonTag("https://www.amazon.com/dp/B0BQXJX5GH?tag=loveveryfans-20");
    const matches = url.match(/tag=/g);
    expect(matches).toHaveLength(1);
  });

  it("replaces an incorrect tag", () => {
    const url = ensureAmazonTag("https://www.amazon.com/dp/B0BQXJX5GH?tag=wrongtag-21");
    expect(url).toContain("tag=loveveryfans-20");
    expect(url).not.toContain("wrongtag-21");
  });

  it("does not modify non-Amazon URLs", () => {
    const url = "https://example.com/product";
    expect(ensureAmazonTag(url)).toBe(url);
  });

  it("handles URLs with existing query parameters", () => {
    const url = ensureAmazonTag("https://www.amazon.com/dp/B0BQXJX5GH?ref=sr_1_1");
    expect(url).toContain("ref=sr_1_1");
    expect(url).toContain("tag=loveveryfans-20");
  });
});
