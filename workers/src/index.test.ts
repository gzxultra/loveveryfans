/**
 * Tests for Loveveryfans Promotion Alert Worker
 *
 * Tests the pure utility functions exported from index.ts:
 * - isEmailWhitelisted
 * - detectPromotions
 * - buildEmailHtml
 * - EMAIL_RE
 */

import { describe, it, expect } from "vitest";
import { isEmailWhitelisted, detectPromotions, buildEmailHtml, EMAIL_RE } from "./index";

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
// buildEmailHtml
// ---------------------------------------------------------------------------

describe("buildEmailHtml", () => {
  const baseParams = {
    subject: "Test Subject",
    title: "Test Title",
    body: "<p>Test body content</p>",
    ctaText: "Click Here",
    ctaUrl: "https://loveveryfans.com",
    unsubscribeUrl: "https://loveveryfans.com/unsubscribe?email=test@example.com",
    footerText: "You received this because you subscribed.",
    unsubscribeText: "Unsubscribe",
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

  it("includes the CTA button with correct URL", () => {
    const html = buildEmailHtml(baseParams);
    expect(html).toContain('href="https://loveveryfans.com"');
    expect(html).toContain("Click Here");
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

  it("generates valid HTML with Chinese content", () => {
    const html = buildEmailHtml({
      ...baseParams,
      subject: "🎉 Lovevery 促销提醒",
      title: "Lovevery 促销来啦！",
      body: "<p>我们检测到促销活动。</p>",
      ctaText: "查看指南",
      footerText: "你订阅了促销提醒。",
      unsubscribeText: "退订",
    });
    expect(html).toContain("Lovevery 促销来啦！");
    expect(html).toContain("我们检测到促销活动。");
    expect(html).toContain("查看指南");
    expect(html).toContain("退订");
  });
});
