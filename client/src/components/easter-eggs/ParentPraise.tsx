/**
 * Parent Praise Easter Egg
 *
 * Displays a warm, encouraging message to parents.
 * Appears once per session after 20–40 seconds of browsing,
 * with a beautiful slide-up animation and auto-dismiss.
 */
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Heart, X, Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const PRAISE_MESSAGES: Array<{ en: string; cn: string; emoji: string }> = [
  {
    emoji: "🌟",
    en: "You're doing an amazing job, parent!",
    cn: "你真的是一位超棒的父母！",
  },
  {
    emoji: "💛",
    en: "Your baby is so lucky to have you.",
    cn: "有你这样用心的父母，宝宝真的很幸福。",
  },
  {
    emoji: "🔍",
    en: "Researching the best toys? That's great parenting.",
    cn: "愿意花时间给宝宝研究玩具，这本身就是爱的表现。",
  },
  {
    emoji: "🕰️",
    en: "Every moment you spend with them matters more than any toy.",
    cn: "你陪伴宝宝的每一个瞬间，都比任何玩具都珍贵。",
  },
  {
    emoji: "🤍",
    en: "You are exactly the parent your child needs.",
    cn: "你就是宝宝最需要的那个人。",
  },
  {
    emoji: "☕",
    en: "It's okay to feel tired. You're doing your best — and that's everything.",
    cn: "觉得累也没关系，你已经做得很棒了。",
  },
  {
    emoji: "🧭",
    en: "Trust your instincts. You know your baby better than anyone.",
    cn: "相信你的直觉，你是最了解宝宝的人。",
  },
  {
    emoji: "💝",
    en: "Your love is the best gift your child could ever receive.",
    cn: "你的爱，就是宝宝最珍贵的礼物。",
  },
  {
    emoji: "🌿",
    en: "Take a breath. You've got this.",
    cn: "深呼吸，你完全可以做到的。",
  },
  {
    emoji: "🌍",
    en: "Parents like you make the world a warmer place.",
    cn: "有你这样的父母，世界都变得更温暖了。",
  },
  {
    emoji: "🌸",
    en: "Don't forget to take care of yourself, too. You matter.",
    cn: "照顾好宝宝的同时，也别忘了好好爱自己。",
  },
  {
    emoji: "✨",
    en: "Your patience and dedication are truly beautiful.",
    cn: "你的耐心和付出，真的令人感动。",
  },
  {
    emoji: "🎈",
    en: "No perfect parent exists — but a loving one is more than enough.",
    cn: "没有完美的父母，但有爱的父母就足够了。",
  },
  {
    emoji: "🌙",
    en: "Even on the hard days, you show up. That counts for everything.",
    cn: "就算是最难熬的日子，你也坚持陪在宝宝身边。这很了不起。",
  },
];

export default function ParentPraise() {
  const { lang } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [message, setMessage] = useState(PRAISE_MESSAGES[0]);

  useEffect(() => {
    const hasSeenPraise = sessionStorage.getItem("hasSeenParentPraise");
    if (hasSeenPraise) return;

    // Show after 20–40 seconds — feels serendipitous, not intrusive
    const delay = Math.floor(Math.random() * 20_000) + 20_000;

    const timer = setTimeout(() => {
      const randomMsg = PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)];
      setMessage(randomMsg);
      setIsVisible(true);
      sessionStorage.setItem("hasSeenParentPraise", "true");
      trackEvent("easter_egg_parent_praise", { message_en: randomMsg.en });
      // Auto-dismiss after 10 seconds
      setTimeout(() => dismiss(), 10_000);
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setIsLeaving(true);
    setTimeout(() => setIsVisible(false), 400);
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-24 right-4 sm:right-6 z-[9000] max-w-[320px] sm:max-w-sm"
      style={{
        animation: isLeaving
          ? "praiseSlideDown 0.4s cubic-bezier(0.4,0,1,1) both"
          : "praiseSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      <style>{`
        @keyframes praiseSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes praiseSlideDown {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(16px) scale(0.95); }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.25); }
          50% { transform: scale(1); }
          75% { transform: scale(1.15); }
        }
      `}</style>

      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #fff8f5 0%, #fff5f8 50%, #f8f5ff 100%)",
          border: "1.5px solid #f0e4dc",
          boxShadow: "0 12px 40px rgba(61,50,41,0.14), 0 2px 8px rgba(61,50,41,0.08)",
        }}
      >
        {/* Decorative blob */}
        <div
          className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #FFB5C8 0%, transparent 70%)" }}
        />

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full
            text-[#9B8E7E] hover:text-[#3D3229] hover:bg-black/5 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="p-5 pr-10">
          {/* Header row */}
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #FFE4EC, #FFD6E7)" }}
            >
              <Heart
                className="w-4 h-4 text-[#FF6B8A] fill-[#FF6B8A]"
                style={{ animation: "heartbeat 1.8s ease-in-out infinite" }}
              />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#FF6B8A]">
              {lang === "cn" ? "给你的小惊喜" : "A little surprise for you"}
            </p>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 ml-auto mr-1 shrink-0" />
          </div>

          {/* Emoji + message */}
          <div className="flex items-start gap-2.5">
            <span className="text-2xl leading-none mt-0.5 shrink-0">{message.emoji}</span>
            <p className="text-sm font-medium text-[#3D3229] leading-relaxed">
              {lang === "cn" ? message.cn : message.en}
            </p>
          </div>

          {/* Footer */}
          <p className="text-[10px] text-[#B0A89E] mt-3 text-right">
            {lang === "cn" ? "来自 Lovevery Fans ❤️" : "From Lovevery Fans ❤️"}
          </p>
        </div>
      </div>
    </div>
  );
}
