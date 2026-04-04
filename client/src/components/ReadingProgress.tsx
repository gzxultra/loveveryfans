/**
 * ReadingProgress — A slim progress bar at the top of detail pages
 * showing how far the user has scrolled through the content.
 */
import { useState, useEffect } from "react";

interface ReadingProgressProps {
  color?: string;
}

export default function ReadingProgress({ color = "#7FB685" }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const h = document.documentElement;
      const b = document.body;
      const st = h.scrollTop || b.scrollTop;
      const sh = h.scrollHeight || b.scrollHeight;
      const ch = h.clientHeight;
      const percent = (st / (sh - ch)) * 100;
      setProgress(Math.min(100, Math.max(0, percent)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (progress < 2) return null;

  return (
    <div
      className="fixed top-[56px] sm:top-[64px] left-0 right-0 z-40 h-[2px] bg-transparent pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div
        className="h-full transition-[width] duration-150 ease-out"
        style={{
          width: `${progress}%`,
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}40`,
        }}
      />
    </div>
  );
}
