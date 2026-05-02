/**
 * FloatingCommentButton — A floating action button that guides users to leave feedback.
 *
 * Appears after the user has scrolled past the hero section (300px).
 * Sits above the BackToTop button. Clicking it scrolls to the feedback section
 * and opens the form.
 */
import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FloatingCommentButtonProps {
  /** Callback when user clicks the button */
  onOpen?: () => void;
}

export default function FloatingCommentButton({ onOpen }: FloatingCommentButtonProps) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [pulsed, setPulsed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Pulse once after 5 seconds to attract attention
  useEffect(() => {
    if (!visible || pulsed) return;
    const t = setTimeout(() => setPulsed(true), 5000);
    return () => clearTimeout(t);
  }, [visible, pulsed]);

  const handleClick = () => {
    const el = document.getElementById("feedback");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    onOpen?.();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 right-4 sm:right-6 z-40 flex flex-col items-end gap-2"
      style={{ filter: "drop-shadow(0 4px 12px rgba(61,50,41,0.18))" }}
    >
      <button
        onClick={handleClick}
        className={`group flex items-center gap-2 bg-white border border-[#E8DFD3] text-[#3D3229] rounded-full
          px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium
          hover:bg-[#3D3229] hover:text-white hover:border-[#3D3229]
          transition-all duration-300 active:scale-[0.96]
          ${pulsed ? "animate-bounce" : ""}`}
        aria-label={t("留言反馈", "Leave feedback")}
        onAnimationEnd={() => setPulsed(false)}
      >
        <MessageCircle className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">{t("留言", "Feedback")}</span>
      </button>
    </div>
  );
}
