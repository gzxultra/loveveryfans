/**
 * BackToTop — An enhanced scroll-to-top button that appears after scrolling down.
 * Shows scroll percentage and has smooth animation.
 */
import { useState, useEffect, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function BackToTop() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    setVisible(scrollTop > 400);
    setProgress(Math.min(100, Math.max(0, scrollPercent)));
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm border border-border shadow-lg shadow-foreground/10 flex items-center justify-center hover:bg-white hover:shadow-xl hover:border-border transition-all duration-300 active:scale-95 group"
      aria-label={t("回到顶部", "Scroll to top")}
      title={t("回到顶部", "Back to top")}
    >
      {/* Progress ring */}
      <svg
        className="absolute inset-0 w-full h-full -rotate-90"
        viewBox="0 0 44 44"
      >
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          strokeWidth="2"
          className="stroke-[#E8DFD3] dark:stroke-[#3A352C]"
        />
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke="#7FB685"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <ArrowUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors relative z-10" />
    </button>
  );
}
