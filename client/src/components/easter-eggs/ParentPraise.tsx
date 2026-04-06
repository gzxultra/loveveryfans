/**
 * Parent Praise Easter Egg
 *
 * Displays a random encouraging message to parents.
 * Shows up occasionally (e.g., 10% chance) when navigating or scrolling,
 * to give parents a warm, fuzzy feeling.
 */
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Heart, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const PRAISE_MESSAGES = [
  {
    en: "You're doing an amazing job!",
    cn: "你把宝宝照顾得真好！",
  },
  {
    en: "Your baby is lucky to have you!",
    cn: "有你这样的父母，宝宝真的很幸福！",
  },
  {
    en: "Taking time to research toys? That's great parenting!",
    cn: "愿意花时间给宝宝研究玩具，你是个超棒的父母！",
  },
  {
    en: "Every little moment you spend with them matters.",
    cn: "你陪伴宝宝的每一个瞬间，都充满意义。",
  },
  {
    en: "You are exactly the parent your child needs.",
    cn: "你就是宝宝最需要的、最好的父母。",
  },
  {
    en: "It's okay to feel tired. You're doing your best!",
    cn: "觉得累也没关系，你已经做得很棒了！",
  },
  {
    en: "Trust your instincts. You know your baby best.",
    cn: "相信你的直觉，你是最了解宝宝的人。",
  },
  {
    en: "Your love is the best toy your child could ever have.",
    cn: "你的爱，就是宝宝最珍贵的玩具。",
  },
  {
    en: "Breathe. You've got this.",
    cn: "深呼吸，一切都在你的掌控之中。",
  },
  {
    en: "Seeing you care so much makes the world a better place.",
    cn: "看到你这么用心，这个世界都变得更美好了。",
  },
  {
    en: "Don't forget to take care of yourself, too!",
    cn: "照顾宝宝的同时，也别忘了好好照顾自己哦！",
  },
  {
    en: "Your patience and dedication are truly inspiring.",
    cn: "你的耐心和付出，真的让人感动。",
  }
];

export default function ParentPraise() {
  const { lang } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState(PRAISE_MESSAGES[0]);

  useEffect(() => {
    // Only show once per session to avoid being annoying
    const hasSeenPraise = sessionStorage.getItem("hasSeenParentPraise");
    if (hasSeenPraise) return;

    // Show after a random delay (between 15s and 45s) to simulate a serendipitous moment
    const delay = Math.floor(Math.random() * 30000) + 15000;
    
    const timer = setTimeout(() => {
      // 30% chance to show up to make it feel special
      if (Math.random() < 0.3) {
        const randomMsg = PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)];
        setMessage(randomMsg);
        setIsVisible(true);
        sessionStorage.setItem("hasSeenParentPraise", "true");
        
        trackEvent("easter_egg_parent_praise", {
          message_en: randomMsg.en
        });
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 8000);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-white/95 backdrop-blur-md border border-[#F0EBE3] shadow-lg shadow-[#3D3229]/10 rounded-2xl p-4 pr-10 max-w-sm relative group">
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-3 right-3 text-[#9B8E7E] hover:text-[#3D3229] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="bg-[#FFF5F5] p-2 rounded-full shrink-0">
            <Heart className="w-5 h-5 text-[#FF6B6B] fill-[#FF6B6B] animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#3D3229] leading-relaxed">
              {lang === "en" ? message.en : message.cn}
            </p>
            <p className="text-[10px] text-[#9B8E7E] mt-1.5">
              {lang === "en" ? "Just a little reminder ❤️" : "一个小小的提醒 ❤️"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
