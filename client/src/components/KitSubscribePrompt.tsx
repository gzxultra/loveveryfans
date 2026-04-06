/**
 * KitSubscribePrompt — Inline subscription prompt for Kit detail pages.
 * Shown near the price/stats area. Expands to show email input on click.
 * Bilingual (CN/EN). Styled consistently with the site.
 */

import { useState, useCallback } from "react";
import { Bell, Mail, Loader2, CheckCircle, ChevronRight, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useI18n } from "@/hooks/useI18n";
import { trackEvent } from "@/lib/analytics";
import { motion, AnimatePresence } from "framer-motion";

const SUBSCRIBE_API_URL = import.meta.env.VITE_SUBSCRIBE_API_URL || "";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubscribeState = "idle" | "loading" | "success" | "error";

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
    await new Promise((resolve) => setTimeout(resolve, 600));
    console.log(`[Mock] KitPrompt subscribed: ${email} (lang: ${language})`);
  }
}

interface KitSubscribePromptProps {
  kitId: string;
  kitColor: string;
}

export default function KitSubscribePrompt({ kitId, kitColor }: KitSubscribePromptProps) {
  const { lang } = useLanguage();
  const i18n = useI18n();

  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribeState, setSubscribeState] = useState<SubscribeState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleExpand = useCallback(() => {
    setExpanded(true);
    trackEvent("kit_subscribe_prompt_expand", { kit_id: kitId });
  }, [kitId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = email.trim();

      if (!EMAIL_REGEX.test(trimmed)) {
        setErrorMsg(i18n.kitSubscribePrompt.invalidEmail[lang]);
        setSubscribeState("error");
        return;
      }

      setSubscribeState("loading");
      setErrorMsg("");

      try {
        await subscribeEmail(trimmed, lang === "cn" ? "zh" : "en");
        setSubscribeState("success");
        trackEvent("email_subscribe", {
          email: trimmed,
          language: lang,
          source: "kit_detail_prompt",
          kit_id: kitId,
        });
      } catch (err) {
        setSubscribeState("error");
        setErrorMsg(
          err instanceof Error ? err.message : i18n.kitSubscribePrompt.error[lang]
        );
      }
    },
    [email, lang, i18n, kitId]
  );

  return (
    <div
      data-testid="kit-subscribe-prompt"
      className="mt-4 sm:mt-5 rounded-xl border border-[#E8DFD3] bg-gradient-to-r from-[#F8FBF8] to-[#FAF7F2] overflow-hidden transition-all duration-300"
    >
      <AnimatePresence mode="wait">
        {subscribeState === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-3"
          >
            <CheckCircle className="w-4 h-4 text-[#5a9e65] shrink-0" />
            <p className="text-sm text-[#2D5A35] font-medium">
              {i18n.kitSubscribePrompt.success[lang]}
            </p>
          </motion.div>
        ) : expanded ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="px-4 py-3"
          >
            <div className="flex items-center gap-2 mb-2.5">
              <Bell className="w-3.5 h-3.5" style={{ color: kitColor }} />
              <p className="text-sm text-[#3D3229] font-medium">
                {i18n.kitSubscribePrompt.hint[lang]}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9B8E7E] pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (subscribeState === "error") setSubscribeState("idle");
                  }}
                  placeholder={i18n.kitSubscribePrompt.placeholder[lang]}
                  className={`w-full pl-8 pr-3 py-2 rounded-lg border text-sm text-[#3D3229] placeholder-[#9B8E7E] bg-white outline-none transition-all focus:ring-2 focus:ring-[#7FB685]/40 ${
                    subscribeState === "error"
                      ? "border-red-300"
                      : "border-[#E8DFD3] focus:border-[#7FB685]"
                  }`}
                  disabled={subscribeState === "loading"}
                  autoFocus
                  aria-label={i18n.kitSubscribePrompt.placeholder[lang]}
                />
              </div>
              <button
                type="submit"
                disabled={subscribeState === "loading" || !email.trim()}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 hover:shadow-md active:scale-[0.98]"
                style={{
                  backgroundColor: kitColor,
                  opacity: subscribeState === "loading" || !email.trim() ? 0.6 : 1,
                }}
              >
                {subscribeState === "loading" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bell className="w-3.5 h-3.5" />
                )}
                {subscribeState === "loading"
                  ? i18n.kitSubscribePrompt.subscribing[lang]
                  : i18n.kitSubscribePrompt.button[lang]}
              </button>
            </form>
            {subscribeState === "error" && errorMsg && (
              <div className="flex items-center gap-1 mt-2">
                <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                <p className="text-xs text-red-500">{errorMsg}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.button
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleExpand}
            className="w-full flex items-center justify-between px-4 py-3 group hover:bg-[#F0F9F2]/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5" style={{ color: kitColor }} />
              <span className="text-sm text-[#6B5E50] group-hover:text-[#3D3229] transition-colors">
                {i18n.kitSubscribePrompt.hint[lang]}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className="text-xs font-semibold"
                style={{ color: kitColor }}
              >
                {i18n.kitSubscribePrompt.cta[lang]}
              </span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" style={{ color: kitColor }} />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export { EMAIL_REGEX };
