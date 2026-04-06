/**
 * Tests for Loveveryfans Promotion Alert Worker
 *
 * Covers:
 *   - EMAIL_RE                  — email validation regex
 *   - isEmailWhitelisted        — whitelist logic
 *   - fnv1a32                   — FNV-1a hash function
 *   - hashPageContent           — normalised page content fingerprint
 *   - extractPromoRegions       — targeted HTML promo region extraction
 *   - detectPromotions          — v2 precise detection with confidence scoring
 *   - buildEmailHtml            — HTML email template
 *   - Constants & URL helpers   — REFERRAL_CODE, AMAZON_AFFILIATE_TAG, etc.
 */

import { describe, it, expect } from "vitest";
import {
  isEmailWhitelisted,
  detectPromotions,
  extractPromoRegions,
  fnv1a32,
  hashPageContent,
  buildEmailHtml,
  EMAIL_RE,
  REFERRAL_CODE,
  AMAZON_AFFILIATE_TAG,
  PROMO_CONFIDENCE_THRESHOLD,
  PROMO_SIGNAL_PATTERNS,
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
// fnv1a32 — FNV-1a hash
// ---------------------------------------------------------------------------

describe("fnv1a32", () => {
  it("returns an 8-character hex string", () => {
    const hash = fnv1a32("hello");
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("is deterministic — same input produces same hash", () => {
    expect(fnv1a32("lovevery")).toBe(fnv1a32("lovevery"));
  });

  it("produces different hashes for different inputs", () => {
    expect(fnv1a32("sale 20% off")).not.toBe(fnv1a32("no promotions today"));
  });

  it("handles empty string without throwing", () => {
    expect(() => fnv1a32("")).not.toThrow();
    expect(fnv1a32("")).toMatch(/^[0-9a-f]{8}$/);
  });

  it("handles unicode characters", () => {
    expect(() => fnv1a32("促销活动 20% off")).not.toThrow();
    expect(fnv1a32("促销活动")).toMatch(/^[0-9a-f]{8}$/);
  });

  it("known value: empty string produces FNV offset basis", () => {
    // FNV-1a 32-bit offset basis = 0x811c9dc5 = "811c9dc5"
    expect(fnv1a32("")).toBe("811c9dc5");
  });
});

// ---------------------------------------------------------------------------
// hashPageContent
// ---------------------------------------------------------------------------

describe("hashPageContent", () => {
  it("returns an 8-character hex string", () => {
    const hash = hashPageContent("<html><body>Hello</body></html>");
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("is deterministic for the same HTML", () => {
    const html = "<html><body><p>Lovevery play kits</p></body></html>";
    expect(hashPageContent(html)).toBe(hashPageContent(html));
  });

  it("produces different hashes for different visible content", () => {
    const a = "<html><body><p>No sale today</p></body></html>";
    const b = "<html><body><p>20% off all play kits!</p></body></html>";
    expect(hashPageContent(a)).not.toBe(hashPageContent(b));
  });

  it("ignores script tag content (dynamic nonces/tokens)", () => {
    const base = "<html><body><p>Shop now</p></body></html>";
    const withScript = `<html><body><script>var nonce='${Math.random()}';</script><p>Shop now</p></body></html>`;
    expect(hashPageContent(base)).toBe(hashPageContent(withScript));
  });

  it("ignores style tag content", () => {
    const base = "<html><body><p>Shop now</p></body></html>";
    const withStyle = "<html><body><style>.sale{color:red}</style><p>Shop now</p></body></html>";
    expect(hashPageContent(base)).toBe(hashPageContent(withStyle));
  });

  it("is case-insensitive (normalises to lowercase)", () => {
    const lower = "<html><body><p>shop now</p></body></html>";
    const upper = "<html><body><p>SHOP NOW</p></body></html>";
    expect(hashPageContent(lower)).toBe(hashPageContent(upper));
  });

  it("collapses extra whitespace before hashing", () => {
    const compact = "<html><body><p>shop now</p></body></html>";
    const spacey = "<html><body><p>shop   now</p></body></html>";
    expect(hashPageContent(compact)).toBe(hashPageContent(spacey));
  });
});

// ---------------------------------------------------------------------------
// extractPromoRegions
// ---------------------------------------------------------------------------

describe("extractPromoRegions", () => {
  it("returns empty string for plain HTML with no promo elements", () => {
    const html = "<html><body><p>Welcome to Lovevery.</p></body></html>";
    expect(extractPromoRegions(html)).toBe("");
  });

  it("extracts text from announcement bar elements", () => {
    const html = `<div class="announcement-bar">Get 20% off today!</div>`;
    const result = extractPromoRegions(html);
    expect(result).toContain("20% off");
  });

  it("extracts text from promo-bar elements", () => {
    const html = `<div class="promo-bar">Use code SAVE15 for 15% off</div>`;
    const result = extractPromoRegions(html);
    expect(result).toContain("save15");
  });

  it("extracts text from site-banner elements", () => {
    const html = `<header class="site-banner">Flash sale ends tonight!</header>`;
    const result = extractPromoRegions(html);
    expect(result).toContain("flash sale");
  });

  it("extracts text from elements with data-promo attributes", () => {
    const html = `<div data-promo="true">Limited time offer: $10 off</div>`;
    const result = extractPromoRegions(html);
    expect(result).toContain("$10 off");
  });

  it("extracts text from sale-badge elements", () => {
    const html = `<span class="sale-badge">SALE</span>`;
    const result = extractPromoRegions(html);
    expect(result).toContain("sale");
  });

  it("returns lowercase text", () => {
    const html = `<div class="announcement-bar">BIG SALE TODAY</div>`;
    const result = extractPromoRegions(html);
    expect(result).toBe(result.toLowerCase());
  });

  it("does not extract text from non-promo elements", () => {
    const html = `<div class="product-description">We offer great toys for babies.</div>`;
    const result = extractPromoRegions(html);
    // "offer" in a product description should not be extracted as a promo region
    expect(result).toBe("");
  });

  it("handles multiple promo elements in one page", () => {
    const html = `
      <div class="announcement-bar">20% off all kits</div>
      <div class="promo-banner">Use code PLAY20</div>
    `;
    const result = extractPromoRegions(html);
    expect(result).toContain("20% off");
    expect(result).toContain("play20");
  });

  it("strips HTML tags from extracted regions", () => {
    const html = `<div class="promo-bar"><strong>Sale ends</strong> <em>tonight</em>!</div>`;
    const result = extractPromoRegions(html);
    expect(result).not.toContain("<strong>");
    expect(result).not.toContain("<em>");
    expect(result).toContain("sale ends");
  });
});

// ---------------------------------------------------------------------------
// detectPromotions — false positive prevention
// ---------------------------------------------------------------------------

describe("detectPromotions — false positive prevention", () => {
  it("does NOT trigger on 'we offer great products'", () => {
    const html = "<p>We offer great products for your baby's development.</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(false);
  });

  it("does NOT trigger on 'save to wishlist'", () => {
    const html = "<button>Save to wishlist</button>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(false);
  });

  it("does NOT trigger on 'sale' appearing in a URL slug", () => {
    const html = '<a href="/wholesale-partners">Wholesale Partners</a>';
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(false);
  });

  it("does NOT trigger on generic 'free shipping' policy text", () => {
    // Permanent free shipping policy — not time-limited
    const html = "<p>We offer free shipping on all orders over $50.</p>";
    const result = detectPromotions(html);
    // Free shipping alone has weight 1, which is below threshold of 2
    expect(result.isPromotion).toBe(false);
  });

  it("does NOT trigger on 'discount' in a product description", () => {
    const html = "<p>Our play kits are designed without any discount to quality.</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(false);
  });

  it("does NOT trigger on 'deal' in a non-promotional context", () => {
    const html = "<p>A great deal of care goes into every Lovevery product.</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(false);
  });

  it("does NOT trigger on a typical Lovevery product page with no sale", () => {
    const html = `
      <html><body>
        <h1>The Play Kits</h1>
        <p>We offer thoughtfully designed toys for every stage.</p>
        <p>Save to wishlist and come back later.</p>
        <a href="/collections/play-kits">Shop all kits</a>
        <p>Free standard shipping on orders over $75.</p>
      </body></html>
    `;
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// detectPromotions — true positive detection
// ---------------------------------------------------------------------------

describe("detectPromotions — true positive detection", () => {
  it("detects '20% off' pattern", () => {
    const html = "<p>Get 20% off your first order today!</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("percentage off"))).toBe(true);
  });

  it("detects '$10 off' pattern", () => {
    const html = "<p>Save $10 off when you spend $50 or more.</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("dollar amount off"))).toBe(true);
  });

  it("detects 'use code SAVE20' pattern", () => {
    const html = "<p>Use code SAVE20 at checkout for 20% off.</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("discount code callout"))).toBe(true);
  });

  it("detects 'promo code: PLAY15' pattern", () => {
    const html = "<p>Enter promo code: PLAY15 to save on your order.</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("promo code"))).toBe(true);
  });

  it("detects 'coupon code BABY10' pattern", () => {
    const html = "<p>Apply coupon code BABY10 for $10 off.</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("coupon code"))).toBe(true);
  });

  it("detects 'sale ends' pattern", () => {
    const html = "<p>Hurry! Sale ends Sunday at midnight.</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("sale ends"))).toBe(true);
  });

  it("detects 'limited time offer' pattern", () => {
    const html = "<p>This is a limited time offer — don't miss out!</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("limited time"))).toBe(true);
  });

  it("detects 'limited time sale' pattern", () => {
    const html = "<p>Limited time sale on all play kits.</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
  });

  it("detects 'flash sale' pattern", () => {
    const html = "<p>Flash sale: 30% off for the next 24 hours!</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("flash sale"))).toBe(true);
  });

  it("detects 'today only' pattern", () => {
    const html = "<p>Today only — buy any play kit and save big.</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("today only"))).toBe(true);
  });

  it("detects 'up to 40% off' pattern", () => {
    const html = "<p>Up to 40% off selected play kits this weekend.</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("up to X% off"))).toBe(true);
  });

  it("detects 'site-wide sale' pattern", () => {
    const html = "<p>Site-wide sale — everything is discounted!</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("site-wide sale"))).toBe(true);
  });

  it("detects 'extra 15% off' pattern", () => {
    const html = "<p>Get an extra 15% off with your subscription.</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("extra X% off"))).toBe(true);
  });

  it("detects 'get $20 off' pattern", () => {
    const html = "<p>Get $20 off your next order!</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("get $X off"))).toBe(true);
  });

  it("detects 'buy one get one free' pattern", () => {
    const html = "<p>Buy one get one free on all starter kits!</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("buy X get Y"))).toBe(true);
  });

  it("detects 'BOGO' pattern", () => {
    const html = "<p>BOGO deal on play kits this week only.</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("BOGO"))).toBe(true);
  });

  it("detects 'free gift with purchase' pattern", () => {
    const html = "<p>Free gift with every purchase over $100.</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("free gift"))).toBe(true);
  });

  it("detects 'clearance sale' pattern", () => {
    const html = "<p>Clearance sale — limited stock remaining!</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("clearance"))).toBe(true);
  });

  it("detects 'Black Friday' sale pattern", () => {
    const html = "<p>Black Friday deals are here — shop now!</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("named seasonal sale"))).toBe(true);
  });

  it("detects 'Cyber Monday' pattern", () => {
    const html = "<p>Cyber Monday sale starts at midnight!</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
  });

  it("detects 'ends today' urgency pattern", () => {
    const html = "<p>This offer ends today — grab yours now.</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
    expect(result.signals.some((s) => s.label.includes("sale ending soon"))).toBe(true);
  });

  it("detects 'ends in 2 hours' urgency pattern", () => {
    const html = "<p>Sale ends in 2 hours — don't wait!</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
  });

  it("is case-insensitive for all patterns", () => {
    const html = "<p>FLASH SALE: 25% OFF ALL PLAY KITS!</p>";
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// detectPromotions — scoring and structure
// ---------------------------------------------------------------------------

describe("detectPromotions — scoring and structure", () => {
  it("returns score 0 and isPromotion false for non-promotional text", () => {
    const html = "<p>Lovevery makes thoughtful toys for babies.</p>";
    const result = detectPromotions(html);
    expect(result.score).toBe(0);
    expect(result.isPromotion).toBe(false);
    expect(result.signals).toHaveLength(0);
  });

  it("returns correct structure with signals array", () => {
    const html = "<p>Get 20% off with code SAVE20 today!</p>";
    const result = detectPromotions(html);
    expect(result).toHaveProperty("signals");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("isPromotion");
    expect(Array.isArray(result.signals)).toBe(true);
  });

  it("each signal has label (string) and weight (positive number)", () => {
    const html = "<p>Flash sale: 30% off all kits!</p>";
    const result = detectPromotions(html);
    for (const signal of result.signals) {
      expect(typeof signal.label).toBe("string");
      expect(signal.label.length).toBeGreaterThan(0);
      expect(typeof signal.weight).toBe("number");
      expect(signal.weight).toBeGreaterThan(0);
    }
  });

  it("score equals sum of all signal weights", () => {
    const html = "<p>Flash sale: 30% off all kits!</p>";
    const result = detectPromotions(html);
    const expectedScore = result.signals.reduce((sum, s) => sum + s.weight, 0);
    expect(result.score).toBe(expectedScore);
  });

  it("does not double-count the same signal pattern", () => {
    // "20% off" appears twice — should only be counted once
    const html = "<p>20% off all kits! Yes, 20% off!</p>";
    const result = detectPromotions(html);
    const percentOffSignals = result.signals.filter((s) => s.label.includes("percentage off"));
    expect(percentOffSignals).toHaveLength(1);
  });

  it("accumulates score from multiple distinct signals", () => {
    const html = "<p>Flash sale ends today: 25% off all kits!</p>";
    const result = detectPromotions(html);
    // Should match: flash sale (2) + sale ending soon (2) + percentage off (3) = 7
    expect(result.score).toBeGreaterThanOrEqual(5);
    expect(result.isPromotion).toBe(true);
  });

  it("PROMO_CONFIDENCE_THRESHOLD is exported and is a positive number", () => {
    expect(typeof PROMO_CONFIDENCE_THRESHOLD).toBe("number");
    expect(PROMO_CONFIDENCE_THRESHOLD).toBeGreaterThan(0);
  });

  it("PROMO_SIGNAL_PATTERNS is exported and non-empty", () => {
    expect(Array.isArray(PROMO_SIGNAL_PATTERNS)).toBe(true);
    expect(PROMO_SIGNAL_PATTERNS.length).toBeGreaterThan(0);
  });

  it("all PROMO_SIGNAL_PATTERNS have pattern, label, and positive weight", () => {
    for (const entry of PROMO_SIGNAL_PATTERNS) {
      expect(entry.pattern).toBeInstanceOf(RegExp);
      expect(typeof entry.label).toBe("string");
      expect(entry.label.length).toBeGreaterThan(0);
      expect(typeof entry.weight).toBe("number");
      expect(entry.weight).toBeGreaterThan(0);
    }
  });

  it("detects promotions in raw HTML without pre-stripping tags", () => {
    const html = `
      <html>
        <body>
          <div class="announcement-bar">
            <p>Use code <strong>SAVE20</strong> for 20% off!</p>
          </div>
          <main>
            <p>We offer great play kits for every stage.</p>
          </main>
        </body>
      </html>
    `;
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// detectPromotions — targeted region vs full-page detection
// ---------------------------------------------------------------------------

describe("detectPromotions — targeted region detection", () => {
  it("detects promotion in announcement bar even when body text is clean", () => {
    const html = `
      <div class="announcement-bar">Flash sale: 30% off today!</div>
      <main>
        <p>Lovevery play kits are thoughtfully designed for your child's development.</p>
        <p>We offer free shipping on orders over $75.</p>
      </main>
    `;
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
  });

  it("detects promotion from data-promo attribute elements", () => {
    const html = `
      <div data-promo="holiday">Limited time offer: buy 2 get 1 free!</div>
      <p>Regular product description with no sale language.</p>
    `;
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
  });

  it("detects promotion from top-bar element", () => {
    const html = `
      <div class="top-bar">Site-wide sale — up to 25% off!</div>
      <p>Explore our full range of play kits.</p>
    `;
    const result = detectPromotions(html);
    expect(result.isPromotion).toBe(true);
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
