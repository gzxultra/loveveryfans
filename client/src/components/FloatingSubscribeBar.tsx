/**
 * FloatingSubscribeBar — A bottom floating bar that slides up when the user
 * scrolls to 50-60% of the page. Dismissible and remembers dismissal via
 * localStorage. Bilingual (CN/EN). Styled consistently with the site.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Bell, Mail, Loader2, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useI18n } from "@/hooks/useI18n";
import { trackEvent } from "@/lib/analytics";

const SUBSCRIBE_API_URL = import.meta.env.VITE_SUBSCRIBE_API_URL || "";
const STORAGE_KEY = "loveveryfans-floating-bar-dismissed";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SCROLL_THRESHOLD_MIN = 0.50;
const SCROLL_THRESHOLD_MAX = 0.60;

type BarState = "hidden" | "visible" | "dismissed";
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
    // TODO: integrate real email subscription API;
  }
}

export default function FloatingSubscribeBar() {
  const { lang } = useLanguage();
  const i18n = useI18n();

  const [barState, setBarState] = useState<BarState>("hidden");
  const [subscribeState, setSubscribeState] = useState<SubscribeState>("idle");
  const [email, setEmail] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const hasTriggeredRef = useRef(false);

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed === "true") {
      setBarState("dismissed");
    }
  }, []);

  // Scroll listener
  useEffect(() => {
    if (barState === "dismissed") return;

    const handleScroll = () => {
      if (hasTriggeredRef.current) return;

      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollPercent = scrollTop / (scrollHeight - clientHeight);

      if (scrollPercent >= SCROLL_THRESHOLD_MIN && scrollPercent <= SCROLL_THRESHOLD_MAX) {
        hasTriggeredRef.current = true;
        setBarState("visible");
        trackEvent("floating_bar_shown", { scroll_percent: Math.round(scrollPercent * 100) });
      } else if (scrollPercent > SCROLL_THRESHOLD_MAX && !hasTriggeredRef.current) {
        // Also show if user scrolls past the range (e.g. fast scroll)
        hasTriggeredRef.current = true;
        setBarState("visible");
        trackEvent("floating_bar_shown", { scroll_percent: Math.round(scrollPercent * 100) });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [barState]);

  const handleDismiss = useCallback(() => {
    setBarState("dismissed");
    localStorage.setItem(STORAGE_KEY, "true");
    trackEvent("floating_bar_dismissed", {});
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = email.trim();

      if (!EMAIL_REGEX.test(trimmed)) {
        setErrorMsg(i18n.floatingBar.invalidEmail[lang]);
        setSubscribeState("error");
        return;
      }

      setSubscribeState("loading");
      setErrorMsg("");

      try {
        await subscribeEmail(trimmed, lang === "cn" ? "zh" : "en");
        setSubscribeState("success");
        trackEvent("email_subscribe", { email: trimmed, language: lang, source: "floating_bar" });
        // Auto-dismiss after success
        setTimeout(() => {
          handleDismiss();
        }, 2500);
      } catch (err) {
        setSubscribeState("error");
        setErrorMsg(
          err instanceof Error ? err.message : i18n.floatingBar.error[lang]
        );
      }
    },
    [email, lang, i18n, handleDismiss]
  );

  if (barState !== "visible") return null;

  return (
    <div
      data-testid="floating-subscribe-bar"
      className="fixed bottom-0 left-0 right-0 z-[60] animate-in slide-in-from-bottom duration-500"
    >
      {/* Subtle top shadow */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#7FB685]/30 to-transparent" />
      <div className="bg-white/95 backdrop-blur-lg border-t border-[#E8DFD3]/80 shadow-[0_-4px_24px_rgba(61,50,41,0.08)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Icon */}
            <div className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl bg-[#E8F5EC] shrink-0">
              <Bell className="w-4.5 h-4.5 text-[#5a9e65]" />
            </div>

            {/* Text */}
            <p className="text-sm sm:text-[15px] text-[#3D3229] font-medium flex-shrink-0">
              {i18n.floatingBar.text[lang]}
            </p>

            {/* Action area */}
            <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3">
              {subscribeState === "success" ? (
                <div className="flex items-center gap-1.5 text-sm text-[#5a9e65] font-medium">
                  <CheckCircle className="w-4 h-4" />
                  {i18n.floatingBar.success[lang]}
                </div>
              ) : showInput ? (
                <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 max-w-sm">
                  <div className="relative flex-1">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9B8E7E] pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (subscribeState === "error") setSubscribeState("idle");
                      }}
                      placeholder={i18n.floatingBar.placeholder[lang]}
                      className={`w-full pl-8 pr-3 py-2 rounded-lg border text-sm text-[#3D3229] placeholder-[#9B8E7E] bg-white outline-none transition-all focus:ring-2 focus:ring-[#7FB685]/40 ${
                        subscribeState === "error"
                          ? "border-red-300"
                          : "border-[#E8DFD3] focus:border-[#7FB685]"
                      }`}
                      disabled={subscribeState === "loading"}
                      autoFocus
                      aria-label={i18n.floatingBar.placeholder[lang]}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={subscribeState === "loading" || !email.trim()}
                    className="px-4 py-2 rounded-lg bg-[#5a9e65] hover:bg-[#4a8e55] disabled:bg-[#A8D5B0] text-white text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5"
                  >
                    {subscribeState === "loading" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="hidden sm:inline">{i18n.floatingBar.subscribing[lang]}</span>
                      </>
                    ) : (
                      i18n.floatingBar.button[lang]
                    )}
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setShowInput(true);
                    trackEvent("floating_bar_cta_click", {});
                  }}
                  className="px-4 py-2 rounded-lg bg-[#5a9e65] hover:bg-[#4a8e55] text-white text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 hover:shadow-md hover:shadow-[#5a9e65]/20"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {i18n.floatingBar.button[lang]}
                </button>
              )}

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-[#9B8E7E] hover:text-[#3D3229] hover:bg-[#F0EBE3] transition-all shrink-0"
                aria-label={i18n.floatingBar.close[lang]}
                data-testid="floating-bar-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Error message */}
          {subscribeState === "error" && errorMsg && (
            <p className="text-xs text-red-500 mt-1.5 text-right">{errorMsg}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Export constants for testing
export { STORAGE_KEY, SCROLL_THRESHOLD_MIN, SCROLL_THRESHOLD_MAX, EMAIL_REGEX };
