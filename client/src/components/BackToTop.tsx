/**
 * BackToTop — An enhanced scroll-to-top button that appears after scrolling down.
 * Shows scroll percentage and has smooth animation.
 */
import { useState, useEffect, useCallback } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
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
      className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm border border-[#E8DFD3] shadow-lg shadow-[#3D3229]/10 flex items-center justify-center hover:bg-white hover:shadow-xl hover:border-[#C8BFB3] transition-all duration-300 active:scale-95 group"
      aria-label="Scroll to top"
      title="Back to top"
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
          stroke="#E8DFD3"
          strokeWidth="2"
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
      <ArrowUp className="w-4 h-4 text-[#6B5E50] group-hover:text-[#3D3229] transition-colors relative z-10" />
    </button>
  );
}
