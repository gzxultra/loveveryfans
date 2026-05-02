/**
 * EmailSubscription — Email subscription form for Lovevery promotion alerts.
 *
 * Features:
 * - Beautiful design consistent with the site's Montessori/Scandinavian style
 * - Bilingual (CN/EN) support
 * - Email validation
 * - Success/error feedback with animation
 * - Mock API for development, easy to switch to real Cloudflare Workers API
 *
 * API Configuration:
 *   Set VITE_SUBSCRIBE_API_URL environment variable to point to the real
 *   Cloudflare Workers endpoint. If not set, uses a mock implementation.
 */

import { useState, useCallback } from "react";
import { Mail, Bell, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useI18n } from "@/hooks/useI18n";
import { trackEvent } from "@/lib/analytics";

// API endpoint — set via env var for production, falls back to mock
const SUBSCRIBE_API_URL = import.meta.env.VITE_SUBSCRIBE_API_URL || "";

/** Simple email validation regex */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubscribeState = "idle" | "loading" | "success" | "error";

/**
 * Subscribe to the mailing list.
 * Uses real API if VITE_SUBSCRIBE_API_URL is configured, otherwise mocks.
 */
async function subscribeEmail(email: string, language: string): Promise<void> {
  if (SUBSCRIBE_API_URL) {
    const res = await fetch(`${SUBSCRIBE_API_URL}/api/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, language }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Subscription failed");
    }
  } else {
    // Mock API — simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    // Simulate success (in dev mode)
    // TODO: integrate real email subscription API;
  }
}

export default function EmailSubscription() {
  const { lang } = useLanguage();
  const i18n = useI18n();

  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubscribeState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate email
      if (!EMAIL_REGEX.test(email.trim())) {
        setErrorMsg(i18n.subscribe.invalidEmail[lang]);
        setState("error");
        return;
      }

      setState("loading");
      setErrorMsg("");

      try {
        await subscribeEmail(email.trim(), lang === "cn" ? "zh" : "en");
        setState("success");
        trackEvent("email_subscribe", { email: email.trim(), language: lang });
      } catch (err) {
        setState("error");
        setErrorMsg(
          err instanceof Error ? err.message : i18n.subscribe.error[lang]
        );
      }
    },
    [email, lang, i18n]
  );

  return (
    <section className="relative py-12 sm:py-16 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F0F9F2] via-[#F5F0EB] to-[#FAF7F2]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, #3D3229 1px, transparent 0)",
        backgroundSize: "24px 24px",
      }} />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E8F5EC] mb-5">
          <Bell className="w-7 h-7 text-[#5a9e65]" />
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-[#3D3229] mb-2">
          {i18n.subscribe.title[lang]}
        </h2>
        <p className="text-sm sm:text-base text-[#6B5E50] mb-6 max-w-lg mx-auto leading-relaxed">
          {i18n.subscribe.subtitle[lang]}
        </p>

        {/* Form or Success state */}
        {state === "success" ? (
          <div className="flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-[#E8F5EC] border border-[#A8D5B0] animate-in fade-in zoom-in-95 duration-300">
            <CheckCircle className="w-5 h-5 text-[#5a9e65] shrink-0" />
            <p className="text-sm font-medium text-[#2D5A35]">
              {i18n.subscribe.success[lang]}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8E7E] pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state === "error") setState("idle");
                }}
                placeholder={i18n.subscribe.placeholder[lang]}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-[#3D3229] placeholder-[#9B8E7E] bg-white/80 backdrop-blur-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#7FB685]/40 ${
                  state === "error"
                    ? "border-red-300 focus:border-red-400"
                    : "border-[#E8DFD3] focus:border-[#7FB685]"
                }`}
                disabled={state === "loading"}
                aria-label={i18n.subscribe.placeholder[lang]}
              />
            </div>
            <button
              type="submit"
              disabled={state === "loading" || !email.trim()}
              className="px-6 py-3 rounded-xl bg-[#5a9e65] hover:bg-[#4a8e55] disabled:bg-[#A8D5B0] text-white text-sm font-semibold transition-all duration-200 hover:shadow-md hover:shadow-[#5a9e65]/20 active:scale-[0.98] flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {state === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {i18n.subscribe.subscribing[lang]}
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  {i18n.subscribe.button[lang]}
                </>
              )}
            </button>
          </form>
        )}

        {/* Error message */}
        {state === "error" && errorMsg && (
          <div className="flex items-center justify-center gap-1.5 mt-3 animate-in fade-in duration-200">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <p className="text-xs text-red-500">{errorMsg}</p>
          </div>
        )}

        {/* Privacy note */}
        <p className="text-xs text-[#9B8E7E] mt-4">
          {i18n.subscribe.privacy[lang]}
        </p>
      </div>
    </section>
  );
}
