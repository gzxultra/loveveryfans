/**
 * ScrollToTop — A floating "back to top" button that appears
 * when the user scrolls down past a threshold.
 */
import { useState, useEffect, useCallback } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#3D3229] text-white shadow-lg shadow-[#3D3229]/20 flex items-center justify-center hover:bg-[#2A231C] hover:shadow-xl transition-all duration-300 active:scale-90 opacity-90 hover:opacity-100"
      aria-label="Scroll to top"
      title="Back to top"
    >
      <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
    </button>
  );
}
