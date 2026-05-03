/**
 * Loveveryfans Promotion Alert Worker
 * ====================================
 * Cloudflare Worker that handles:
 *   POST /api/subscribe   — Add email to subscriber list
 *   POST /api/unsubscribe — Remove email from subscriber list
 *   Cron trigger           — Check for Lovevery promotions and notify subscribers
 *
 * Email whitelist:
 *   The EMAIL_WHITELIST env var controls who receives promo emails.
 *   - Set to a comma-separated list of emails (e.g., "a@b.com,c@d.com")
 *   - Set to "*" to send to all active subscribers
 *   - Default: "mygladfinger@gmail.com"
 *
 * Promotion detection strategy (v2):
 *   1. Diff-based: compare current page content hash against the last stored
 *      hash in D1; skip notification if nothing changed.
 *   2. Precise regex: only match explicit promotional patterns such as
 *      "20% off", "$10 off", "sale ends", "limited time offer", "use code XXX".
 *   3. Targeted extraction: search promo-specific HTML regions (announcement
 *      bars, banner elements, sale badges) before falling back to full text.
 *   4. Confidence scoring: accumulate signal weights; only fire when the total
 *      score meets the PROMO_CONFIDENCE_THRESHOLD.
 */

export interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
  EMAIL_WHITELIST: string;
  FROM_EMAIL: string;
  SITE_URL: string;
  ADMIN_API_KEY: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REFERRAL_CODE = "REF-6AA44A5A";
const AMAZON_AFFILIATE_TAG = "loveveryfans-20";

/**
 * Minimum confidence score required to treat a page as having an active
 * promotion.  Each matched signal contributes its weight; the threshold
 * prevents single weak signals (e.g. a generic "offer" word) from firing.
 */
export const PROMO_CONFIDENCE_THRESHOLD = 2;

// ---------------------------------------------------------------------------
// CORS helpers
// ---------------------------------------------------------------------------

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function corsResponse(body: string | null, status: number, extra?: Record<string, string>): Response {
  return new Response(body, {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json", ...extra },
  });
}

// ---------------------------------------------------------------------------
// Email validation
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// Whitelist logic
// ---------------------------------------------------------------------------

function isEmailWhitelisted(email: string, whitelist: string): boolean {
  const trimmed = (whitelist || "").trim();
  if (trimmed === "*") return true;
  const allowed = trimmed.split(",").map((e) => e.trim().toLowerCase());
  return allowed.includes(email.toLowerCase());
}

// ---------------------------------------------------------------------------
// Referral URL helpers
// ---------------------------------------------------------------------------

function getLoveveryReferralUrl(path?: string): string {
  const base = path
    ? `https://lovevery.com${path}`
    : "https://lovevery.com/collections/play-kits";
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}discount_code=${REFERRAL_CODE}&utm_source=loveveryfans&utm_medium=referral&utm_campaign=email_promo`;
}

function getAmazonAlternativesUrl(): string {
  return `https://www.amazon.com/s?k=montessori+toys&tag=${AMAZON_AFFILIATE_TAG}`;
}

// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (url.pathname === "/api/subscribe" && request.method === "POST") {
    return handleSubscribe(request, env);
  }

  if (url.pathname === "/api/unsubscribe" && request.method === "POST") {
    return handleUnsubscribe(request, env);
  }

  // Admin endpoints
  if (url.pathname === "/admin/subscribers" && request.method === "GET") {
    return handleAdminSubscribers(request, env);
  }

  if (url.pathname === "/admin/subscribers/count" && request.method === "GET") {
    return handleAdminSubscribersCount(request, env);
  }

  // Submission endpoints
  if (url.pathname === "/api/submissions" && request.method === "POST") {
    return handleCreateSubmission(request, env);
  }
  if (url.pathname === "/api/submissions" && request.method === "GET") {
    return handleGetApprovedSubmissions(request, env);
  }
  if (url.pathname === "/admin/submissions" && request.method === "GET") {
    return handleAdminGetSubmissions(request, env);
  }
  if (url.pathname.startsWith("/admin/submissions/") && request.method === "PUT") {
    return handleAdminUpdateSubmission(request, env);
  }

  return corsResponse(JSON.stringify({ error: "Not found" }), 404);
}

// ---------------------------------------------------------------------------
// POST /api/subscribe
// ---------------------------------------------------------------------------

async function handleSubscribe(request: Request, env: Env): Promise<Response> {
  let body: { email?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return corsResponse(JSON.stringify({ error: "Invalid JSON body" }), 400);
  }

  const email = (body.email || "").trim().toLowerCase();
  const language = body.language === "zh" ? "zh" : "en";

  if (!EMAIL_RE.test(email)) {
    return corsResponse(JSON.stringify({ error: "Invalid email address" }), 400);
  }

  try {
    // Upsert: insert or re-activate if previously unsubscribed
    await env.DB.prepare(
      `INSERT INTO subscribers (email, language)
       VALUES (?1, ?2)
       ON CONFLICT(email) DO UPDATE SET
         language = ?2,
         unsubscribed_at = NULL,
         subscribed_at = datetime('now')`
    )
      .bind(email, language)
      .run();

    // Send welcome/confirmation email (fire-and-forget, don't block response)
    try {
      await sendWelcomeEmail(env, email, language);
    } catch (err) {
      console.error("Welcome email error:", err);
    }

    return corsResponse(JSON.stringify({ ok: true, email }), 200);
  } catch (err) {
    console.error("Subscribe error:", err);
    return corsResponse(JSON.stringify({ error: "Internal server error" }), 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/unsubscribe
// ---------------------------------------------------------------------------

async function handleUnsubscribe(request: Request, env: Env): Promise<Response> {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return corsResponse(JSON.stringify({ error: "Invalid JSON body" }), 400);
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return corsResponse(JSON.stringify({ error: "Invalid email address" }), 400);
  }

  try {
    await env.DB.prepare(
      `UPDATE subscribers SET unsubscribed_at = datetime('now') WHERE email = ?1`
    )
      .bind(email)
      .run();

    return corsResponse(JSON.stringify({ ok: true }), 200);
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return corsResponse(JSON.stringify({ error: "Internal server error" }), 500);
  }
}

// ---------------------------------------------------------------------------
// Welcome/Confirmation email
// ---------------------------------------------------------------------------

async function sendWelcomeEmail(env: Env, to: string, language: string): Promise<void> {
  const siteUrl = env.SITE_URL || "https://loveveryfans.com";
  const unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(to)}`;

  const subject = "Welcome to Loveveryfans! 🎉 欢迎订阅 Loveveryfans 促销通知";

  const html = buildWelcomeEmailHtml({ siteUrl, unsubscribeUrl });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL || "Loveveryfans <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend API error ${res.status}: ${errText}`);
  }
}

// ---------------------------------------------------------------------------
// Welcome email HTML template
// ---------------------------------------------------------------------------

interface WelcomeEmailParams {
  siteUrl: string;
  unsubscribeUrl: string;
}

function buildWelcomeEmailHtml(params: WelcomeEmailParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Welcome to Loveveryfans</title>
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    .preheader { display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#FAF7F2;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div class="preheader">You're subscribed to Loveveryfans sale alerts! 你已成功订阅促销通知！</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF7F2;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(61,50,41,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#5a9e65 0%,#7FB685 50%,#5a9e65 100%);padding:28px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                Loveveryfans
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-weight:500;letter-spacing:0.3px;">
                Play Kit & Product Guide
              </p>
            </td>
          </tr>

          <!-- WELCOME CONTENT -->
          <tr>
            <td style="padding:32px 40px 0;">
              <h2 style="margin:0 0 16px;color:#3D3229;font-size:24px;font-weight:800;letter-spacing:-0.3px;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                Welcome! 欢迎加入！
              </h2>
              <div style="background-color:#F0F9F2;border-left:4px solid #5a9e65;border-radius:0 12px 12px 0;padding:16px 20px;margin-bottom:20px;">
                <p style="margin:0;color:#3D3229;font-size:15px;line-height:1.7;">
                  <strong>English:</strong> You've successfully subscribed to Loveveryfans promotion alerts! We'll notify you as soon as Lovevery has any sales, discounts, or special offers so you never miss a deal.
                </p>
              </div>
              <div style="background-color:#F0F9F2;border-left:4px solid #5a9e65;border-radius:0 12px 12px 0;padding:16px 20px;margin-bottom:20px;">
                <p style="margin:0;color:#3D3229;font-size:15px;line-height:1.7;">
                  <strong>中文：</strong>你已成功订阅 Loveveryfans 促销通知！当 Lovevery 有任何打折、优惠或特别活动时，我们会第一时间通知你，让你不错过任何省钱机会。
                </p>
              </div>
            </td>
          </tr>

          <!-- WHAT TO EXPECT -->
          <tr>
            <td style="padding:0 40px 24px;">
              <h3 style="margin:0 0 12px;color:#3D3229;font-size:18px;font-weight:700;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                What to expect / 你会收到什么
              </h3>
              <ul style="margin:0;padding:0 0 0 20px;color:#6B5E50;font-size:15px;line-height:2;">
                <li>Sale alerts when Lovevery runs promotions / Lovevery 促销时的即时通知</li>
                <li>Exclusive discount codes we find / 我们发现的独家优惠码</li>
                <li>No spam — only real deals / 绝不发垃圾邮件，只发真实优惠</li>
              </ul>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 28px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:linear-gradient(135deg,#5a9e65 0%,#4a8e55 100%);border-radius:12px;box-shadow:0 4px 12px rgba(90,158,101,0.3);">
                    <a href="${params.siteUrl}" target="_blank" style="display:inline-block;padding:16px 40px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:0.3px;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      Visit Loveveryfans / 访问网站
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 40px;background-color:#F5F0EB;border-top:1px solid #E8DFD3;">
              <p style="margin:0 0 4px;color:#3D3229;font-size:13px;font-weight:700;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                Loveveryfans
              </p>
              <p style="margin:0 0 12px;color:#9B8E7E;font-size:12px;line-height:1.6;">
                You received this email because you subscribed to Loveveryfans promotion alerts.<br/>
                你收到这封邮件是因为你订阅了 Loveveryfans 促销通知。
              </p>
              <a href="${params.unsubscribeUrl}" style="color:#9B8E7E;font-size:12px;text-decoration:underline;">
                Unsubscribe / 退订
              </a>
            </td>
          </tr>

        </table>

        <p style="margin:20px 0 0;color:#B0A89E;font-size:11px;text-align:center;">
          Loveveryfans — Complete Play Kit & Product Guide
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Admin authentication helper
// ---------------------------------------------------------------------------

function authenticateAdmin(request: Request, env: Env): boolean {
  const url = new URL(request.url);

  // Check query parameter ?key=xxx
  const queryKey = url.searchParams.get("key");
  if (queryKey && queryKey === env.ADMIN_API_KEY) {
    return true;
  }

  // Check Authorization header: Bearer <key>
  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token === env.ADMIN_API_KEY) {
      return true;
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// GET /admin/subscribers
// ---------------------------------------------------------------------------

async function handleAdminSubscribers(request: Request, env: Env): Promise<Response> {
  if (!authenticateAdmin(request, env)) {
    return corsResponse(JSON.stringify({ error: "Unauthorized" }), 401);
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT email, language, subscribed_at, unsubscribed_at,
              CASE WHEN unsubscribed_at IS NULL THEN 'active' ELSE 'unsubscribed' END AS status
       FROM subscribers
       ORDER BY subscribed_at DESC`
    ).all<{
      email: string;
      language: string;
      subscribed_at: string;
      unsubscribed_at: string | null;
      status: string;
    }>();

    return corsResponse(
      JSON.stringify({ ok: true, count: results?.length ?? 0, subscribers: results ?? [] }),
      200
    );
  } catch (err) {
    console.error("Admin subscribers error:", err);
    return corsResponse(JSON.stringify({ error: "Internal server error" }), 500);
  }
}

// ---------------------------------------------------------------------------
// GET /admin/subscribers/count
// ---------------------------------------------------------------------------

async function handleAdminSubscribersCount(request: Request, env: Env): Promise<Response> {
  if (!authenticateAdmin(request, env)) {
    return corsResponse(JSON.stringify({ error: "Unauthorized" }), 401);
  }

  try {
    const total = await env.DB.prepare(
      `SELECT COUNT(*) as total FROM subscribers`
    ).first<{ total: number }>();

    const active = await env.DB.prepare(
      `SELECT COUNT(*) as active FROM subscribers WHERE unsubscribed_at IS NULL`
    ).first<{ active: number }>();

    return corsResponse(
      JSON.stringify({
        ok: true,
        total: total?.total ?? 0,
        active: active?.active ?? 0,
      }),
      200
    );
  } catch (err) {
    console.error("Admin subscribers count error:", err);
    return corsResponse(JSON.stringify({ error: "Internal server error" }), 500);
  }
}

// ---------------------------------------------------------------------------
// Promotion detection — v2
// ---------------------------------------------------------------------------

/**
 * A single promotion signal with a descriptive label and a confidence weight.
 * Higher weight = stronger evidence of an active promotion.
 */
export interface PromoSignal {
  /** Human-readable description of the matched pattern, e.g. "20% off". */
  label: string;
  /** Confidence contribution of this signal (positive integer). */
  weight: number;
}

/**
 * Result returned by {@link detectPromotions}.
 */
export interface PromoDetectionResult {
  /** All signals that were matched. */
  signals: PromoSignal[];
  /** Sum of all signal weights. */
  score: number;
  /** True when score >= PROMO_CONFIDENCE_THRESHOLD. */
  isPromotion: boolean;
}

// ---------------------------------------------------------------------------
// Targeted HTML region extraction
// ---------------------------------------------------------------------------

/**
 * CSS-like selector patterns that identify promotional UI regions in the raw
 * HTML source.  We look for common patterns used by Shopify storefronts and
 * Lovevery's own markup: announcement bars, promo banners, sale badges, and
 * discount callout blocks.
 *
 * Each entry is a regex that matches an opening HTML tag whose attributes
 * suggest a promotional context.  We then extract the inner text of the
 * matched element up to a reasonable character limit.
 */
const PROMO_ELEMENT_PATTERNS: RegExp[] = [
  // Announcement / promo bar (common Shopify pattern)
  /<[^>]+(?:class|id)="[^"]*(?:announcement|promo[-_]?bar|promo[-_]?banner|sale[-_]?bar|discount[-_]?bar|offer[-_]?bar)[^"]*"[^>]*>/gi,
  // Elements with data attributes signalling promotions
  /<[^>]+data-(?:promo|promotion|sale|discount|offer|banner)[^>]*>/gi,
  // Shopify section / block types for promotions
  /<[^>]+(?:class|id)="[^"]*(?:sale[-_]badge|promo[-_]tag|discount[-_]tag|savings[-_]badge|percent[-_]off)[^"]*"[^>]*>/gi,
  // Generic "banner" or "callout" containers that often carry sale copy
  /<[^>]+(?:class|id)="[^"]*(?:site[-_]?banner|top[-_]?bar|header[-_]?banner|callout[-_]?bar)[^"]*"[^>]*>/gi,
];

/**
 * Extract text content from promotional HTML regions.
 *
 * For each pattern, we find the opening tag in the raw HTML, then grab up to
 * 500 characters of following content (enough to capture the inner text of a
 * banner without parsing the full DOM).  The extracted snippets are stripped
 * of HTML tags and returned as a single lowercase string.
 *
 * This is intentionally lightweight — no DOM parser dependency — and safe for
 * the Cloudflare Worker runtime.
 */
export function extractPromoRegions(html: string): string {
  const chunks: string[] = [];

  for (const pattern of PROMO_ELEMENT_PATTERNS) {
    // Reset lastIndex because flags include /g
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const start = match.index;
      // Grab up to 500 chars after the opening tag
      const snippet = html.slice(start, start + 500);
      // Strip tags and collapse whitespace
      const text = snippet.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text) chunks.push(text);
    }
  }

  return chunks.join(" ").toLowerCase();
}

// ---------------------------------------------------------------------------
// Precise promotion signal patterns
// ---------------------------------------------------------------------------

/**
 * Each entry defines a regex pattern and the confidence weight it contributes.
 *
 * Design principles:
 *  - High-weight (3): patterns that are unambiguous promotions, e.g. "20% off",
 *    "$10 off", "use code SAVE20".
 *  - Medium-weight (2): patterns that are very likely promotional but could
 *    appear in edge cases, e.g. "sale ends", "flash sale", "limited time offer".
 *  - Low-weight (1): patterns that are suggestive but sometimes appear in
 *    non-promotional contexts, e.g. "free shipping" (could be permanent policy).
 *
 * Patterns are tested against the *targeted promo region text* first, then
 * against the full stripped page text.  A signal is only counted once per URL
 * regardless of how many times it matches.
 */
export const PROMO_SIGNAL_PATTERNS: Array<{ pattern: RegExp; label: string; weight: number }> = [
  // ── Percentage discount ──────────────────────────────────────────────────
  {
    pattern: /\b\d{1,2}\s*%\s*off\b/i,
    label: "percentage off (e.g. 20% off)",
    weight: 3,
  },
  // ── Dollar / currency amount off ─────────────────────────────────────────
  {
    pattern: /\$\d+(?:\.\d{1,2})?\s*off\b/i,
    label: "dollar amount off (e.g. $10 off)",
    weight: 3,
  },
  // ── Discount / promo code callout ────────────────────────────────────────
  {
    pattern: /\buse\s+code\s+[A-Z0-9]{3,}/i,
    label: "discount code callout (e.g. use code SAVE20)",
    weight: 3,
  },
  {
    pattern: /\bpromo\s+code\s*[:\-]?\s*[A-Z0-9]{3,}/i,
    label: "promo code with value",
    weight: 3,
  },
  {
    pattern: /\bcoupon\s+code\s*[:\-]?\s*[A-Z0-9]{3,}/i,
    label: "coupon code with value",
    weight: 3,
  },
  // ── Sale urgency / time-limited ──────────────────────────────────────────
  {
    pattern: /\bsale\s+ends\b/i,
    label: "sale ends (urgency signal)",
    weight: 2,
  },
  {
    pattern: /\bends?\s+(?:today|tonight|soon|in\s+\d+\s+(?:hour|day))/i,
    label: "sale ending soon",
    weight: 2,
  },
  {
    pattern: /\blimited[\s\-]time\s+(?:offer|deal|sale|discount)\b/i,
    label: "limited time offer/deal/sale",
    weight: 2,
  },
  {
    pattern: /\bflash\s+sale\b/i,
    label: "flash sale",
    weight: 2,
  },
  {
    pattern: /\btoday\s+only\b/i,
    label: "today only",
    weight: 2,
  },
  // ── Explicit sale / discount language ────────────────────────────────────
  {
    pattern: /\bup\s+to\s+\d{1,2}\s*%\s*off\b/i,
    label: "up to X% off",
    weight: 3,
  },
  {
    pattern: /\bsite[\s\-]?wide\s+sale\b/i,
    label: "site-wide sale",
    weight: 2,
  },
  {
    pattern: /\bextra\s+\d{1,2}\s*%\s*off\b/i,
    label: "extra X% off",
    weight: 3,
  },
  {
    pattern: /\bget\s+\$\d+\s+off\b/i,
    label: "get $X off",
    weight: 3,
  },
  // ── Buy-one-get-one / bundle deals ───────────────────────────────────────
  {
    pattern: /\bbogo\b/i,
    label: "BOGO deal",
    weight: 2,
  },
  {
    pattern: /\bbuy\s+(?:one|1|two|2|three|3)[,\s]+get\s+(?:one|1|two|2)\s+(?:free|off|\d{1,2}\s*%\s*off)\b/i,
    label: "buy X get Y free/off",
    weight: 3,
  },
  // ── Free shipping (low weight — may be permanent policy) ─────────────────
  {
    pattern: /\bfree\s+(?:standard\s+)?shipping\s+(?:on\s+(?:all|orders?)|today|now|this\s+week)\b/i,
    label: "free shipping promotion",
    weight: 1,
  },
  // ── Gift with purchase ───────────────────────────────────────────────────
  {
    pattern: /\bfree\s+gift\s+with\s+(?:(?:every|each)\s+)?(?:purchase|order)\b/i,
    label: "free gift with purchase",
    weight: 2,
  },
  // ── Clearance ────────────────────────────────────────────────────────────
  {
    pattern: /\bclearance\s+(?:sale|event|items?)\b/i,
    label: "clearance sale/event",
    weight: 2,
  },
  // ── Holiday / seasonal sale names ────────────────────────────────────────
  {
    pattern: /\b(?:black\s+friday|cyber\s+monday|holiday\s+sale|summer\s+sale|spring\s+sale|back[\s\-]to[\s\-]school\s+sale)\b/i,
    label: "named seasonal sale",
    weight: 2,
  },
];

/**
 * Analyse page content for genuine promotional signals.
 *
 * The function operates in two passes:
 *  1. Extract text from targeted promo HTML regions (announcement bars, sale
 *     badges, etc.) and test all signal patterns against that targeted text.
 *  2. Fall back to the full stripped page text for any signals not yet found.
 *
 * Each signal is counted at most once regardless of how many times it appears.
 * The returned result includes all matched signals, the total confidence score,
 * and a boolean indicating whether the threshold was met.
 *
 * @param html  Raw HTML source of the page (not pre-stripped).
 * @returns     PromoDetectionResult
 */
export function detectPromotions(html: string): PromoDetectionResult {
  const signals: PromoSignal[] = [];
  let score = 0;

  // Pass 1: targeted promo regions (higher signal-to-noise)
  const regionText = extractPromoRegions(html);

  // Pass 2: full page text as fallback
  const fullText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

  for (const { pattern, label, weight } of PROMO_SIGNAL_PATTERNS) {
    // Reset stateful regex
    pattern.lastIndex = 0;
    const inRegion = regionText.length > 0 && pattern.test(regionText);
    pattern.lastIndex = 0;
    const inFull = pattern.test(fullText);

    if (inRegion || inFull) {
      signals.push({ label, weight });
      score += weight;
    }
  }

  return {
    signals,
    score,
    isPromotion: score >= PROMO_CONFIDENCE_THRESHOLD,
  };
}

// ---------------------------------------------------------------------------
// Page hash helpers (for diff-based change detection)
// ---------------------------------------------------------------------------

/**
 * Compute a simple 32-bit FNV-1a hash of a string.
 *
 * FNV-1a is fast, has good distribution for short strings, and requires no
 * external dependencies — ideal for the Worker runtime.
 *
 * @param text  Input string to hash.
 * @returns     Hex string representation of the 32-bit hash.
 */
export function fnv1a32(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    // Multiply by FNV prime (32-bit), keeping result within 32 bits
    hash = (Math.imul(hash, 0x01000193) >>> 0);
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * Derive a stable content fingerprint from raw HTML.
 *
 * We hash the *normalised* page text rather than the raw HTML to avoid
 * spurious hash changes caused by dynamic script nonces, cache-busting query
 * strings, or session tokens embedded in the markup.
 *
 * @param html  Raw HTML source.
 * @returns     8-character hex hash string.
 */
export function hashPageContent(html: string): string {
  // Strip tags, collapse whitespace, lowercase — same normalisation used in
  // detectPromotions so the hash reflects visible content changes.
  const normalised = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")   // remove script blocks
    .replace(/<style[\s\S]*?<\/style>/gi, "")      // remove style blocks
    .replace(/<[^>]+>/g, " ")                       // strip remaining tags
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return fnv1a32(normalised);
}

// ---------------------------------------------------------------------------
// Cron: Promotion detection
// ---------------------------------------------------------------------------

const CHECK_URLS = [
  "https://lovevery.com",
  "https://lovevery.com/collections/play-kits",
];

async function fetchPageHtml(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LoveveryfansBot/1.0; +https://loveveryfans.com)",
      },
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

/**
 * Retrieve the stored content hash for a URL from D1.
 * Returns null if no record exists yet.
 */
async function getStoredHash(env: Env, url: string): Promise<string | null> {
  const row = await env.DB.prepare(
    `SELECT content_hash FROM page_snapshots WHERE url = ?1`
  )
    .bind(url)
    .first<{ content_hash: string }>();
  return row?.content_hash ?? null;
}

/**
 * Upsert the content hash for a URL in D1.
 */
async function upsertStoredHash(env: Env, url: string, hash: string): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO page_snapshots (url, content_hash, checked_at)
     VALUES (?1, ?2, datetime('now'))
     ON CONFLICT(url) DO UPDATE SET
       content_hash = ?2,
       checked_at   = datetime('now')`
  )
    .bind(url, hash)
    .run();
}

async function handleCron(env: Env): Promise<void> {
  console.log("[Cron] Starting promotion check (v2)...");

  let combinedHtml = "";
  let anyChanged = false;

  for (const url of CHECK_URLS) {
    const html = await fetchPageHtml(url);
    if (!html) {
      console.warn(`[Cron] Failed to fetch ${url}`);
      continue;
    }

    const currentHash = hashPageContent(html);
    const storedHash = await getStoredHash(env, url);

    if (storedHash === currentHash) {
      console.log(`[Cron] No change detected for ${url} (hash: ${currentHash})`);
    } else {
      console.log(`[Cron] Content changed for ${url}: ${storedHash ?? "new"} → ${currentHash}`);
      anyChanged = true;
    }

    // Always update the stored hash so the next run compares against the
    // latest snapshot, even if we don't send a notification this time.
    await upsertStoredHash(env, url, currentHash);

    combinedHtml += " " + html;
  }

  if (!anyChanged) {
    console.log("[Cron] No page content changes detected. Skipping promotion analysis.");
    return;
  }

  // Run promotion detection on the combined HTML of all changed pages
  const result = detectPromotions(combinedHtml);

  if (!result.isPromotion) {
    console.log(
      `[Cron] No promotions detected (score: ${result.score}/${PROMO_CONFIDENCE_THRESHOLD}).`
    );
    return;
  }

  const signalLabels = result.signals.map((s) => s.label);
  const title = `Lovevery Promotion Detected (confidence: ${result.score})`;
  const description = `Signals: ${signalLabels.join("; ")}`;

  console.log(`[Cron] Promotion confirmed — ${description}`);

  // Deduplicate: skip if we already notified about a promotion in the last 24h
  const recent = await env.DB.prepare(
    `SELECT id FROM promotions
     WHERE detected_at > datetime('now', '-24 hours')
     LIMIT 1`
  ).first();

  if (recent) {
    console.log("[Cron] Already notified about a promotion in the last 24 hours. Skipping.");
    return;
  }

  // Insert new promotion record
  const insertResult = await env.DB.prepare(
    `INSERT INTO promotions (title, description, url) VALUES (?1, ?2, ?3)`
  )
    .bind(title, description, CHECK_URLS[0])
    .run();

  const promoId = insertResult.meta?.last_row_id;

  // Get active subscribers
  const { results: subscribers } = await env.DB.prepare(
    `SELECT email, language FROM subscribers WHERE unsubscribed_at IS NULL`
  ).all<{ email: string; language: string }>();

  if (!subscribers || subscribers.length === 0) {
    console.log("[Cron] No active subscribers.");
    return;
  }

  // Filter by whitelist
  const whitelist = env.EMAIL_WHITELIST || "mygladfinger@gmail.com";
  const eligible = subscribers.filter((s) => isEmailWhitelisted(s.email, whitelist));

  if (eligible.length === 0) {
    console.log(`[Cron] No whitelisted subscribers (whitelist: ${whitelist}).`);
    return;
  }

  console.log(`[Cron] Sending to ${eligible.length} whitelisted subscriber(s)...`);

  // Send emails via Resend
  for (const sub of eligible) {
    try {
      await sendPromoEmail(env, sub.email, sub.language, title, description);
    } catch (err) {
      console.error(`[Cron] Failed to send to ${sub.email}:`, err);
    }
  }

  // Mark promotion as notified
  if (promoId) {
    await env.DB.prepare(
      `UPDATE promotions SET notified_at = datetime('now') WHERE id = ?1`
    )
      .bind(promoId)
      .run();
  }

  console.log("[Cron] Promotion check complete.");
}

// ---------------------------------------------------------------------------
// Email sending via Resend
// ---------------------------------------------------------------------------

async function sendPromoEmail(
  env: Env,
  to: string,
  language: string,
  title: string,
  description: string
): Promise<void> {
  const isZh = language === "zh";
  const siteUrl = env.SITE_URL || "https://loveveryfans.com";
  const unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(to)}`;
  const shopUrl = getLoveveryReferralUrl("/collections/play-kits");
  const amazonUrl = getAmazonAlternativesUrl();

  const subject = isZh
    ? `🎉 Lovevery 促销提醒：${title}`
    : `🎉 Lovevery Sale Alert: ${title}`;

  const html = buildEmailHtml({
    subject,
    preheader: isZh
      ? "Lovevery 正在促销！快来看看有没有你心仪的 Play Kit 在打折。"
      : "Lovevery is having a sale! Check if your favorite Play Kit is discounted.",
    title: isZh ? "Lovevery 促销来啦！" : "Lovevery Sale Alert!",
    promoSummary: isZh
      ? `我们检测到 Lovevery 正在进行促销活动：<strong>${title}</strong><br/>${description}`
      : `We detected a Lovevery promotion: <strong>${title}</strong><br/>${description}`,
    body: isZh
      ? `<p>快去看看有没有你心仪的 Play Kit 在打折吧！通过下方链接购买，你和我们都可以获得优惠。</p>`
      : `<p>Check if your favorite Play Kit is on sale! Use the link below to shop — both you and us get a discount.</p>`,
    shopCtaText: isZh ? "立即抢购 Shop the Sale" : "Shop the Sale",
    shopCtaUrl: shopUrl,
    amazonSectionTitle: isZh ? "高性价比 Amazon 平替推荐" : "Affordable Amazon Alternatives",
    amazonSectionDesc: isZh
      ? "不想花全价？这些 Amazon 上的蒙特梭利玩具同样优质，价格更友好。"
      : "Don't want to pay full price? These Montessori toys on Amazon are great quality at a lower cost.",
    amazonCtaText: isZh ? "浏览 Amazon 平替" : "Browse Amazon Alternatives",
    amazonCtaUrl: amazonUrl,
    siteCtaText: isZh ? "访问 Loveveryfans 完整指南" : "Visit Loveveryfans Guide",
    siteCtaUrl: siteUrl,
    unsubscribeUrl,
    footerText: isZh
      ? "你收到这封邮件是因为你订阅了 Loveveryfans 促销提醒。"
      : "You received this email because you subscribed to Loveveryfans sale alerts.",
    unsubscribeText: isZh ? "退订" : "Unsubscribe",
    footerTagline: isZh
      ? "Loveveryfans — Play Kit 与产品完整指南"
      : "Loveveryfans — Complete Play Kit & Product Guide",
  });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL || "Loveveryfans <alerts@loveveryfans.com>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend API error ${res.status}: ${errText}`);
  }
}

// ---------------------------------------------------------------------------
// HTML email template — redesigned to match loveveryfans.com brand
// ---------------------------------------------------------------------------

interface EmailTemplateParams {
  subject: string;
  preheader: string;
  title: string;
  promoSummary: string;
  body: string;
  shopCtaText: string;
  shopCtaUrl: string;
  amazonSectionTitle: string;
  amazonSectionDesc: string;
  amazonCtaText: string;
  amazonCtaUrl: string;
  siteCtaText: string;
  siteCtaUrl: string;
  unsubscribeUrl: string;
  footerText: string;
  unsubscribeText: string;
  footerTagline: string;
}

function buildEmailHtml(params: EmailTemplateParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${params.subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    table { border-collapse: collapse !important; }
    .preheader { display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#FAF7F2;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- Preheader text -->
  <div class="preheader">${params.preheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF7F2;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(61,50,41,0.08);">

          <!-- ============ HEADER ============ -->
          <tr>
            <td style="background:linear-gradient(135deg,#5a9e65 0%,#7FB685 50%,#5a9e65 100%);padding:28px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                Loveveryfans
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-weight:500;letter-spacing:0.3px;">
                ${params.footerTagline}
              </p>
            </td>
          </tr>

          <!-- ============ PROMO SUMMARY ============ -->
          <tr>
            <td style="padding:32px 40px 0;">
              <h2 style="margin:0 0 16px;color:#3D3229;font-size:24px;font-weight:800;letter-spacing:-0.3px;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                ${params.title}
              </h2>
              <div style="background-color:#F0F9F2;border-left:4px solid #5a9e65;border-radius:0 12px 12px 0;padding:16px 20px;margin-bottom:16px;">
                <p style="margin:0;color:#3D3229;font-size:15px;line-height:1.7;">
                  ${params.promoSummary}
                </p>
              </div>
              <div style="color:#6B5E50;font-size:15px;line-height:1.7;">
                ${params.body}
              </div>
            </td>
          </tr>

          <!-- ============ SHOP THE SALE CTA ============ -->
          <tr>
            <td style="padding:24px 40px 0;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:linear-gradient(135deg,#5a9e65 0%,#4a8e55 100%);border-radius:12px;box-shadow:0 4px 12px rgba(90,158,101,0.3);">
                    <a href="${params.shopCtaUrl}" target="_blank" style="display:inline-block;padding:16px 40px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:0.3px;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      ${params.shopCtaText}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:10px 0 0;color:#9B8E7E;font-size:12px;">
                ❤️ Using this link supports our site &amp; gives you a discount
              </p>
            </td>
          </tr>

          <!-- ============ DIVIDER ============ -->
          <tr>
            <td style="padding:28px 40px 0;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#E8DFD3,transparent);"></div>
            </td>
          </tr>

          <!-- ============ AMAZON ALTERNATIVES SECTION ============ -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF9F0;border-radius:12px;border:1px solid #F0E6D8;overflow:hidden;">
                <tr>
                  <td style="padding:24px;">
                    <h3 style="margin:0 0 8px;color:#3D3229;font-size:18px;font-weight:700;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      🛒 ${params.amazonSectionTitle}
                    </h3>
                    <p style="margin:0 0 16px;color:#6B5E50;font-size:14px;line-height:1.6;">
                      ${params.amazonSectionDesc}
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color:#FF9900;border-radius:8px;">
                          <a href="${params.amazonCtaUrl}" target="_blank" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                            ${params.amazonCtaText}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============ SITE LINK ============ -->
          <tr>
            <td style="padding:24px 40px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border:2px solid #E8DFD3;border-radius:12px;">
                    <a href="${params.siteCtaUrl}" target="_blank" style="display:inline-block;padding:12px 28px;color:#5a9e65;font-size:14px;font-weight:600;text-decoration:none;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      ${params.siteCtaText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============ FOOTER ============ -->
          <tr>
            <td style="padding:24px 40px;background-color:#F5F0EB;border-top:1px solid #E8DFD3;">
              <p style="margin:0 0 4px;color:#3D3229;font-size:13px;font-weight:700;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                Loveveryfans
              </p>
              <p style="margin:0 0 12px;color:#9B8E7E;font-size:12px;line-height:1.6;">
                ${params.footerText}
              </p>
              <a href="${params.unsubscribeUrl}" style="color:#9B8E7E;font-size:12px;text-decoration:underline;">
                ${params.unsubscribeText}
              </a>
            </td>
          </tr>

        </table>

        <!-- ============ BOTTOM BRANDING ============ -->
        <p style="margin:20px 0 0;color:#B0A89E;font-size:11px;text-align:center;">
          ${params.footerTagline}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// POST /api/submissions — Create a new article submission (public)
// ---------------------------------------------------------------------------
async function handleCreateSubmission(request: Request, env: Env): Promise<Response> {
  let body: { kit_id?: string; url?: string; title?: string; description?: string; author_name?: string };
  try {
    body = await request.json();
  } catch {
    return corsResponse(JSON.stringify({ error: "Invalid JSON body" }), 400);
  }

  const kit_id = (body.kit_id || "").trim();
  const url = (body.url || "").trim();
  const title = (body.title || "").trim() || null;
  const description = (body.description || "").trim() || null;
  const author_name = (body.author_name || "").trim() || null;

  if (!kit_id) {
    return corsResponse(JSON.stringify({ error: "kit_id is required" }), 400);
  }
  if (!url) {
    return corsResponse(JSON.stringify({ error: "url is required" }), 400);
  }
  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return corsResponse(JSON.stringify({ error: "Invalid URL format" }), 400);
  }

  try {
    const result = await env.DB.prepare(
      "INSERT INTO submissions (kit_id, url, title, description, author_name) VALUES (?, ?, ?, ?, ?)"
    ).bind(kit_id, url, title, description, author_name).run();

    return corsResponse(JSON.stringify({ success: true, id: result.meta.last_row_id }), 201);
  } catch (err: any) {
    return corsResponse(JSON.stringify({ error: "Database error", detail: err.message }), 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/submissions?kit_id=xxx&status=approved — Get approved submissions (public)
// ---------------------------------------------------------------------------
async function handleGetApprovedSubmissions(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const kit_id = url.searchParams.get("kit_id");
  const status = url.searchParams.get("status") || "approved";

  if (!kit_id) {
    return corsResponse(JSON.stringify({ error: "kit_id query parameter is required" }), 400);
  }

  try {
    const { results } = await env.DB.prepare(
      "SELECT id, kit_id, url, title, description, author_name, submitted_at FROM submissions WHERE kit_id = ? AND status = ? ORDER BY submitted_at DESC"
    ).bind(kit_id, status).all();

    return corsResponse(JSON.stringify({ submissions: results }), 200);
  } catch (err: any) {
    return corsResponse(JSON.stringify({ error: "Database error", detail: err.message }), 500);
  }
}

// ---------------------------------------------------------------------------
// GET /admin/submissions — Get all submissions (admin, requires auth)
// ---------------------------------------------------------------------------
async function handleAdminGetSubmissions(request: Request, env: Env): Promise<Response> {
  if (!authenticateAdmin(request, env)) {
    return corsResponse(JSON.stringify({ error: "Unauthorized" }), 401);
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const kit_id = url.searchParams.get("kit_id");

  let query = "SELECT * FROM submissions";
  const conditions: string[] = [];
  const bindings: string[] = [];

  if (status) {
    conditions.push("status = ?");
    bindings.push(status);
  }
  if (kit_id) {
    conditions.push("kit_id = ?");
    bindings.push(kit_id);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY submitted_at DESC";

  try {
    const stmt = env.DB.prepare(query);
    const { results } = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all();
    return corsResponse(JSON.stringify({ submissions: results }), 200);
  } catch (err: any) {
    return corsResponse(JSON.stringify({ error: "Database error", detail: err.message }), 500);
  }
}

// ---------------------------------------------------------------------------
// PUT /admin/submissions/:id — Update submission status (admin, requires auth)
// ---------------------------------------------------------------------------
async function handleAdminUpdateSubmission(request: Request, env: Env): Promise<Response> {
  if (!authenticateAdmin(request, env)) {
    return corsResponse(JSON.stringify({ error: "Unauthorized" }), 401);
  }

  const reqUrl = new URL(request.url);
  const pathParts = reqUrl.pathname.split("/");
  const id = pathParts[pathParts.length - 1];

  if (!id || isNaN(Number(id))) {
    return corsResponse(JSON.stringify({ error: "Invalid submission ID" }), 400);
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return corsResponse(JSON.stringify({ error: "Invalid JSON body" }), 400);
  }

  const status = (body.status || "").trim();
  if (!["approved", "rejected", "pending"].includes(status)) {
    return corsResponse(JSON.stringify({ error: "Invalid status. Must be: approved, rejected, or pending" }), 400);
  }

  try {
    const result = await env.DB.prepare(
      "UPDATE submissions SET status = ?, reviewed_at = datetime('now') WHERE id = ?"
    ).bind(status, Number(id)).run();

    if (result.meta.changes === 0) {
      return corsResponse(JSON.stringify({ error: "Submission not found" }), 404);
    }

    return corsResponse(JSON.stringify({ success: true, id: Number(id), status }), 200);
  } catch (err: any) {
    return corsResponse(JSON.stringify({ error: "Database error", detail: err.message }), 500);
  }
}

// ---------------------------------------------------------------------------
// Worker entry point
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },

  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    await handleCron(env);
  },
};

// ---------------------------------------------------------------------------
// Exports for testing
// ---------------------------------------------------------------------------

export {
  isEmailWhitelisted,
  buildEmailHtml,
  buildWelcomeEmailHtml,
  authenticateAdmin,
  EMAIL_RE,
  REFERRAL_CODE,
  AMAZON_AFFILIATE_TAG,
  getLoveveryReferralUrl,
  getAmazonAlternativesUrl,
  handleCreateSubmission,
  handleGetApprovedSubmissions,
  handleAdminGetSubmissions,
  handleAdminUpdateSubmission,
};
export type { EmailTemplateParams, WelcomeEmailParams };
