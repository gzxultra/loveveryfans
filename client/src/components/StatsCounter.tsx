/**
 * StatsCounter — Animated statistics section showing key numbers.
 * Provides social proof and content overview at a glance.
 */
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Package, Puzzle, Star, ShoppingBag } from "lucide-react";

interface StatItem {
  icon: React.ReactNode;
  value: number;
  suffix: string;
  label: { cn: string; en: string };
}

const STATS: StatItem[] = [
  {
    icon: <Package className="w-5 h-5" />,
    value: 22,
    suffix: "",
    label: { cn: "Play Kit 套装", en: "Play Kits" },
  },
  {
    icon: <Puzzle className="w-5 h-5" />,
    value: 150,
    suffix: "+",
    label: { cn: "精选玩具", en: "Curated Toys" },
  },
  {
    icon: <ShoppingBag className="w-5 h-5" />,
    value: 500,
    suffix: "+",
    label: { cn: "Amazon 平替", en: "Amazon Alternatives" },
  },
  {
    icon: <Star className="w-5 h-5" />,
    value: 4,
    suffix: "+",
    label: { cn: "独立产品", en: "Standalone Products" },
  },
];

function useCountUp(target: number, duration = 1500, shouldStart: boolean) {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!shouldStart || startedRef.current) return;
    startedRef.current = true;

    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [target, duration, shouldStart]);

  return count;
}

export default function StatsCounter() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
      {STATS.map((stat, idx) => (
        <StatCard key={idx} stat={stat} isVisible={isVisible} delay={idx * 100} />
      ))}
    </div>
  );
}

function StatCard({
  stat,
  isVisible,
  delay,
}: {
  stat: StatItem;
  isVisible: boolean;
  delay: number;
}) {
  const { t } = useLanguage();
  const count = useCountUp(stat.value, 1500, isVisible);

  return (
    <div
      className="text-center p-4 sm:p-5 rounded-xl bg-white/60 border border-[#E8DFD3]/50 transition-all duration-500"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FAF7F2] text-[#7FB685] mb-2">
        {stat.icon}
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-[#3D3229] tabular-nums">
        {count}
        {stat.suffix}
      </div>
      <div className="text-xs text-[#6B5E50] mt-1">
        {t(stat.label.cn, stat.label.en)}
      </div>
    </div>
  );
}
