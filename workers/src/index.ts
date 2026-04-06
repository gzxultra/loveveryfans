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

  const subject = isZh
    ? `🎉 Lovevery 促销提醒：${title}`
    : `🎉 Lovevery Sale Alert: ${title}`;

  const html = buildEmailHtml({
    subject,
    title: isZh ? "Lovevery 促销来啦！" : "Lovevery Sale Alert!",
    body: isZh
      ? `<p>我们检测到 Lovevery 正在进行促销活动：</p>
         <p style="font-size:18px;font-weight:bold;color:#5a9e65;">${title}</p>
         <p>${description}</p>
         <p>快去看看有没有你心仪的 Play Kit 在打折吧！</p>`
      : `<p>We detected a Lovevery promotion:</p>
         <p style="font-size:18px;font-weight:bold;color:#5a9e65;">${title}</p>
         <p>${description}</p>
         <p>Check if your favorite Play Kit is on sale!</p>`,
    ctaText: isZh ? "查看 Loveveryfans 指南" : "Visit Loveveryfans Guide",
    ctaUrl: siteUrl,
    unsubscribeUrl,
    footerText: isZh
      ? "你收到这封邮件是因为你订阅了 Loveveryfans 促销提醒。"
      : "You received this email because you subscribed to Loveveryfans sale alerts.",
    unsubscribeText: isZh ? "退订" : "Unsubscribe",
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
// HTML email template
// ---------------------------------------------------------------------------

interface EmailTemplateParams {
  subject: string;
  title: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  unsubscribeUrl: string;
  footerText: string;
  unsubscribeText: string;
}

function buildEmailHtml(params: EmailTemplateParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${params.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF7F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF7F2;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(61,50,41,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#5a9e65 0%,#7FB685 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                Loveveryfans
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#3D3229;font-size:22px;font-weight:700;">
                ${params.title}
              </h2>
              <div style="color:#6B5E50;font-size:15px;line-height:1.7;">
                ${params.body}
              </div>
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td style="background-color:#5a9e65;border-radius:12px;">
                    <a href="${params.ctaUrl}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                      ${params.ctaText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#F5F0EB;border-top:1px solid #E8DFD3;">
              <p style="margin:0 0 8px;color:#9B8E7E;font-size:12px;line-height:1.6;">
                ${params.footerText}
              </p>
              <a href="${params.unsubscribeUrl}" style="color:#9B8E7E;font-size:12px;text-decoration:underline;">
                ${params.unsubscribeText}
              </a>
            </td>
          </tr>
        </table>
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

export { isEmailWhitelisted, detectPromotions, buildEmailHtml, EMAIL_RE };
