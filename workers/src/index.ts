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
 */

export interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
  EMAIL_WHITELIST: string;
  FROM_EMAIL: string;
  SITE_URL: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REFERRAL_CODE = "REF-6AA44A5A";
const AMAZON_AFFILIATE_TAG = "loveveryfans-20";

// ---------------------------------------------------------------------------
// CORS helpers
// ---------------------------------------------------------------------------

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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
// Cron: Promotion detection
// ---------------------------------------------------------------------------

const PROMO_KEYWORDS = [
  "sale", "% off", "discount", "promo", "coupon", "deal",
  "save", "offer", "clearance", "flash", "limited time",
  "free shipping", "bogo", "buy one get one",
];

const CHECK_URLS = [
  "https://lovevery.com",
  "https://lovevery.com/collections/play-kits",
];

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LoveveryfansBot/1.0; +https://loveveryfans.com)",
      },
    });
    if (!res.ok) return "";
    const html = await res.text();
    // Strip HTML tags for keyword search
    return html.replace(/<[^>]+>/g, " ").toLowerCase();
  } catch {
    return "";
  }
}

function detectPromotions(text: string): string[] {
  const found: string[] = [];
  for (const kw of PROMO_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) {
      found.push(kw);
    }
  }
  return found;
}

async function handleCron(env: Env): Promise<void> {
  console.log("[Cron] Starting promotion check...");

  // Fetch pages
  const texts = await Promise.all(CHECK_URLS.map(fetchPageText));
  const combined = texts.join(" ");

  const keywords = detectPromotions(combined);
  if (keywords.length === 0) {
    console.log("[Cron] No promotions detected.");
    return;
  }

  const title = `Lovevery Promotion Detected: ${keywords.slice(0, 3).join(", ")}`;
  const description = `Keywords found: ${keywords.join(", ")}`;

  // Check if we already notified about a similar promotion in the last 24h
  const recent = await env.DB.prepare(
    `SELECT id FROM promotions
     WHERE title = ?1 AND detected_at > datetime('now', '-24 hours')`
  )
    .bind(title)
    .first();

  if (recent) {
    console.log("[Cron] Already notified about this promotion recently.");
    return;
  }

  // Insert new promotion
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
  detectPromotions,
  buildEmailHtml,
  EMAIL_RE,
  REFERRAL_CODE,
  AMAZON_AFFILIATE_TAG,
  getLoveveryReferralUrl,
  getAmazonAlternativesUrl,
};
export type { EmailTemplateParams };
