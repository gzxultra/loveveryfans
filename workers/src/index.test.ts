/**
 * Tests for Loveveryfans Promotion Alert Worker
 *
 * Tests the pure utility functions exported from index.ts:
 * - isEmailWhitelisted
 * - detectPromotions
 * - buildEmailHtml
 * - EMAIL_RE
 * - REFERRAL_CODE / AMAZON_AFFILIATE_TAG
 * - getLoveveryReferralUrl / getAmazonAlternativesUrl
 */

import { describe, it, expect } from "vitest";
import {
  isEmailWhitelisted,
  detectPromotions,
  buildEmailHtml,
  EMAIL_RE,
  REFERRAL_CODE,
  AMAZON_AFFILIATE_TAG,
  getLoveveryReferralUrl,
  getAmazonAlternativesUrl,
} from "./index";
import type { EmailTemplateParams } from "./index";

// ---------------------------------------------------------------------------
// EMAIL_RE — email validation regex
// ---------------------------------------------------------------------------

describe("EMAIL_RE", () => {
  it("matches a standard email", () => {
    expect(EMAIL_RE.test("user@example.com")).toBe(true);
  });

  it("matches email with subdomain", () => {
    expect(EMAIL_RE.test("user@mail.example.com")).toBe(true);
  });

  it("matches email with plus addressing", () => {
    expect(EMAIL_RE.test("user+tag@example.com")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(EMAIL_RE.test("")).toBe(false);
  });

  it("rejects string without @", () => {
    expect(EMAIL_RE.test("userexample.com")).toBe(false);
  });

  it("rejects string without domain", () => {
    expect(EMAIL_RE.test("user@")).toBe(false);
  });

  it("rejects string with spaces", () => {
    expect(EMAIL_RE.test("user @example.com")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isEmailWhitelisted
// ---------------------------------------------------------------------------

describe("isEmailWhitelisted", () => {
  it('allows all emails when whitelist is "*"', () => {
    expect(isEmailWhitelisted("anyone@example.com", "*")).toBe(true);
  });

  it('allows all emails when whitelist is " * " (with spaces)', () => {
    expect(isEmailWhitelisted("anyone@example.com", " * ")).toBe(true);
  });

  it("allows a whitelisted email (exact match)", () => {
    expect(isEmailWhitelisted("mygladfinger@gmail.com", "mygladfinger@gmail.com")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isEmailWhitelisted("MyGladFinger@Gmail.com", "mygladfinger@gmail.com")).toBe(true);
  });

  it("allows email in a comma-separated whitelist", () => {
    expect(
      isEmailWhitelisted("b@example.com", "a@example.com, b@example.com, c@example.com")
    ).toBe(true);
  });

  it("rejects email not in whitelist", () => {
    expect(isEmailWhitelisted("stranger@example.com", "mygladfinger@gmail.com")).toBe(false);
  });

  it("rejects email when whitelist is empty", () => {
    expect(isEmailWhitelisted("anyone@example.com", "")).toBe(false);
  });

  it("handles whitelist with extra spaces", () => {
    expect(
      isEmailWhitelisted("b@example.com", "  a@example.com ,  b@example.com  ")
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// detectPromotions
// ---------------------------------------------------------------------------

describe("detectPromotions", () => {
  it("returns empty array when no keywords found", () => {
    expect(detectPromotions("lovevery makes great toys for babies")).toEqual([]);
  });

  it("detects 'sale' keyword", () => {
    const result = detectPromotions("big summer sale on all play kits");
    expect(result).toContain("sale");
  });

  it("detects '% off' keyword", () => {
    const result = detectPromotions("get 20% off your first order");
    expect(result).toContain("% off");
  });

  it("detects 'discount' keyword", () => {
    const result = detectPromotions("exclusive discount for new subscribers");
    expect(result).toContain("discount");
  });

  it("detects multiple keywords", () => {
    const result = detectPromotions("flash sale: 30% off with coupon code PLAY");
    expect(result).toContain("sale");
    expect(result).toContain("% off");
    expect(result).toContain("coupon");
    expect(result).toContain("flash");
  });

  it("detects 'free shipping'", () => {
    const result = detectPromotions("enjoy free shipping on orders over $50");
    expect(result).toContain("free shipping");
  });

  it("is case-insensitive (input is expected lowercase)", () => {
    const result = detectPromotions("limited time offer on play kits");
    expect(result).toContain("limited time");
    expect(result).toContain("offer");
  });

  it("detects 'promo'", () => {
    const result = detectPromotions("use promo code to save money");
    expect(result).toContain("promo");
    expect(result).toContain("save");
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("Constants", () => {
  it("has the correct referral code", () => {
    expect(REFERRAL_CODE).toBe("REF-6AA44A5A");
  });

  it("has the correct Amazon affiliate tag", () => {
    expect(AMAZON_AFFILIATE_TAG).toBe("loveveryfans-20");
  });
});

// ---------------------------------------------------------------------------
// getLoveveryReferralUrl
// ---------------------------------------------------------------------------

describe("getLoveveryReferralUrl", () => {
  it("returns a URL with the referral code", () => {
    const url = getLoveveryReferralUrl();
    expect(url).toContain("discount_code=REF-6AA44A5A");
  });

  it("includes utm parameters", () => {
    const url = getLoveveryReferralUrl();
    expect(url).toContain("utm_source=loveveryfans");
    expect(url).toContain("utm_medium=referral");
    expect(url).toContain("utm_campaign=email_promo");
  });

  it("defaults to play-kits collection", () => {
    const url = getLoveveryReferralUrl();
    expect(url).toContain("lovevery.com/collections/play-kits");
  });

  it("uses custom path when provided", () => {
    const url = getLoveveryReferralUrl("/products/the-play-kits-the-explorer");
    expect(url).toContain("lovevery.com/products/the-play-kits-the-explorer");
    expect(url).toContain("discount_code=REF-6AA44A5A");
  });
});

// ---------------------------------------------------------------------------
// getAmazonAlternativesUrl
// ---------------------------------------------------------------------------

describe("getAmazonAlternativesUrl", () => {
  it("returns an Amazon URL with the affiliate tag", () => {
    const url = getAmazonAlternativesUrl();
    expect(url).toContain("amazon.com");
    expect(url).toContain("tag=loveveryfans-20");
  });

  it("searches for montessori toys", () => {
    const url = getAmazonAlternativesUrl();
    expect(url).toContain("k=montessori+toys");
  });
});

// ---------------------------------------------------------------------------
// buildEmailHtml
// ---------------------------------------------------------------------------

describe("buildEmailHtml", () => {
  const baseParams: EmailTemplateParams = {
    subject: "Test Subject",
    preheader: "Test preheader text",
    title: "Test Title",
    promoSummary: "Promo summary content",
    body: "<p>Test body content</p>",
    shopCtaText: "Shop the Sale",
    shopCtaUrl: "https://lovevery.com/collections/play-kits?discount_code=REF-6AA44A5A",
    amazonSectionTitle: "Amazon Alternatives",
    amazonSectionDesc: "Great alternatives at lower prices.",
    amazonCtaText: "Browse Amazon",
    amazonCtaUrl: "https://www.amazon.com/s?k=montessori+toys&tag=loveveryfans-20",
    siteCtaText: "Visit Loveveryfans",
    siteCtaUrl: "https://loveveryfans.com",
    unsubscribeUrl: "https://loveveryfans.com/unsubscribe?email=test@example.com",
    footerText: "You received this because you subscribed.",
    unsubscribeText: "Unsubscribe",
    footerTagline: "Loveveryfans — Complete Play Kit & Product Guide",
  };

  it("returns a string containing DOCTYPE", () => {
    const html = buildEmailHtml(baseParams);
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("includes the subject in the title tag", () => {
    const html = buildEmailHtml(baseParams);
    expect(html).toContain("<title>Test Subject</title>");
  });

  it("includes the title in the body", () => {
    const html = buildEmailHtml(baseParams);
    expect(html).toContain("Test Title");
  });

  it("includes the body content", () => {
    const html = buildEmailHtml(baseParams);
    expect(html).toContain("Test body content");
  });

  it("includes the preheader text", () => {
    const html = buildEmailHtml(baseParams);
    expect(html).toContain("Test preheader text");
  });

  it("includes the promo summary", () => {
    const html = buildEmailHtml(baseParams);
    expect(html).toContain("Promo summary content");
  });

  it("includes the Shop the Sale CTA with correct URL", () => {
    const html = buildEmailHtml(baseParams);
    expect(html).toContain('href="https://lovevery.com/collections/play-kits?discount_code=REF-6AA44A5A"');
    expect(html).toContain("Shop the Sale");
  });

  it("includes the Amazon alternatives section", () => {
    const html = buildEmailHtml(baseParams);
    expect(html).toContain("Amazon Alternatives");
    expect(html).toContain("Great alternatives at lower prices.");
    expect(html).toContain("Browse Amazon");
    expect(html).toContain("tag=loveveryfans-20");
  });

  it("includes the site CTA link", () => {
    const html = buildEmailHtml(baseParams);
    expect(html).toContain("Visit Loveveryfans");
    expect(html).toContain('href="https://loveveryfans.com"');
  });

  it("includes the unsubscribe link", () => {
    const html = buildEmailHtml(baseParams);
    expect(html).toContain("unsubscribe?email=test@example.com");
    expect(html).toContain("Unsubscribe");
  });

  it("includes the footer text", () => {
    const html = buildEmailHtml(baseParams);
    expect(html).toContain("You received this because you subscribed.");
  });

  it("includes the footer tagline", () => {
    const html = buildEmailHtml(baseParams);
    expect(html).toContain("Loveveryfans — Complete Play Kit & Product Guide");
  });

  it("uses the Loveveryfans brand color (#5a9e65)", () => {
    const html = buildEmailHtml(baseParams);
    expect(html).toContain("#5a9e65");
  });

  it("uses the site background color (#FAF7F2)", () => {
    const html = buildEmailHtml(baseParams);
    expect(html).toContain("#FAF7F2");
  });

  it("includes Loveveryfans branding in header", () => {
    const html = buildEmailHtml(baseParams);
    expect(html).toContain("Loveveryfans");
  });

  it("uses Amazon brand color (#FF9900)", () => {
    const html = buildEmailHtml(baseParams);
    expect(html).toContain("#FF9900");
  });

  it("generates valid HTML with Chinese content", () => {
    const html = buildEmailHtml({
      ...baseParams,
      subject: "🎉 Lovevery 促销提醒",
      title: "Lovevery 促销来啦！",
      promoSummary: "检测到促销活动",
      body: "<p>我们检测到促销活动。</p>",
      shopCtaText: "立即抢购 Shop the Sale",
      amazonSectionTitle: "高性价比 Amazon 平替推荐",
      amazonSectionDesc: "不想花全价？这些 Amazon 上的蒙特梭利玩具同样优质。",
      amazonCtaText: "浏览 Amazon 平替",
      siteCtaText: "访问 Loveveryfans 完整指南",
      footerText: "你订阅了促销提醒。",
      unsubscribeText: "退订",
      footerTagline: "Loveveryfans — Play Kit 与产品完整指南",
    });
    expect(html).toContain("Lovevery 促销来啦！");
    expect(html).toContain("我们检测到促销活动。");
    expect(html).toContain("立即抢购 Shop the Sale");
    expect(html).toContain("高性价比 Amazon 平替推荐");
    expect(html).toContain("浏览 Amazon 平替");
    expect(html).toContain("退订");
  });

  it("includes referral code in the shop CTA URL", () => {
    const html = buildEmailHtml(baseParams);
    expect(html).toContain("REF-6AA44A5A");
  });
});
