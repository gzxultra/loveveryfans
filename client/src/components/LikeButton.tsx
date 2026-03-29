/**
 * LikeButton — A heart-shaped like/favorite button with animation.
 *
 * Two variants:
 * - "icon" (default): compact heart icon with count, for kit cards
 * - "full": larger button with label text, for kit detail page
 */
import { Heart } from "lucide-react";
import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LikeButtonProps {
  kitId: string;
  isLiked: boolean;
  likeCount: number;
  onToggle: (kitId: string) => void;
  variant?: "icon" | "full";
  color?: string;
}

export default function LikeButton({
  kitId,
  isLiked,
  likeCount,
  onToggle,
  variant = "icon",
  color,
}: LikeButtonProps) {
  const [animating, setAnimating] = useState(false);
  const { t } = useLanguage();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setAnimating(true);
      onToggle(kitId);
      setTimeout(() => setAnimating(false), 600);
    },
    [kitId, onToggle]
  );

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  if (variant === "full") {
    return (
      <button
        onClick={handleClick}
        className={`group inline-flex items-center gap-2.5 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-sm font-medium transition-all duration-300 active:scale-[0.96] min-h-[44px] ${
          isLiked
            ? "bg-red-50 text-red-500 border-2 border-red-200 hover:bg-red-100 shadow-sm shadow-red-100"
            : "bg-white text-[#6B5E50] border-2 border-[#E8DFD3] hover:border-red-200 hover:text-red-400 hover:bg-red-50/50"
        }`}
        aria-label={isLiked ? t("取消喜欢", "Unlike") : t("喜欢", "Like")}
        title={isLiked ? t("取消喜欢", "Unlike") : t("喜欢这个 Kit", "Like this Kit")}
      >
        <Heart
          className={`w-5 h-5 transition-all duration-300 ${
          animating ? "animate-heart-beat" : ""
        } ${isLiked ? "fill-red-500 text-red-500" : "text-current group-hover:text-red-400"}`}
        />
        <span className="tabular-nums">{formatCount(likeCount)}</span>
        <span className="hidden sm:inline text-xs opacity-70">
          {isLiked ? t("已喜欢", "Liked") : t("喜欢", "Like")}
        </span>
      </button>
    );
  }

  // Icon variant — compact for kit cards on the home page
  return (
    <button
      onClick={handleClick}
      className={`group inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full text-xs transition-all duration-300 active:scale-[0.93] min-h-[32px] ${
        isLiked
          ? "bg-red-50 text-red-500 border border-red-200"
          : "bg-white/80 text-[#756A5C] border border-[#E8DFD3] hover:border-red-200 hover:text-red-400 hover:bg-red-50/50"
      }`}
      aria-label={isLiked ? t("取消喜欢", "Unlike") : t("喜欢", "Like")}
    >
      <Heart
        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-all duration-300 ${
          animating ? "animate-heart-beat" : ""
        } ${isLiked ? "fill-red-500 text-red-500" : "text-current group-hover:text-red-400"}`}
      />
      <span className="tabular-nums text-[10px] sm:text-xs">{formatCount(likeCount)}</span>
    </button>
  );
}
