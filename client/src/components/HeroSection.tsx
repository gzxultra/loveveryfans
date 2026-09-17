/**
 * HeroSection — The hero banner on the Home page.
 *
 * Extracted from Home.tsx for maintainability.
 */

import { useLanguage } from "@/contexts/LanguageContext";
import { useI18n } from "@/hooks/useI18n";
import { ArrowRight, Baby, Sparkles } from "lucide-react";

const HERO_IMG = `${import.meta.env.BASE_URL}hero.webp`;
const HERO_IMG_MOBILE = `${import.meta.env.BASE_URL}hero-mobile.webp`;
const HERO_IMG_FALLBACK = `${import.meta.env.BASE_URL}hero-mobile.jpg`;

interface HeroSectionProps {
  onExplore: () => void;
}

export default function HeroSection({ onExplore }: HeroSectionProps) {
  const { lang, t } = useLanguage();
  const i18n = useI18n();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-accent">
      {/* Decorative background elements */}
      <div className="absolute top-10 right-10 w-64 h-64 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-[#E8A87C]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-[#D4B896]/6 rounded-full blur-2xl pointer-events-none animate-float" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Text content */}
          <div className="animate-[fadeInUp_0.8s_ease-out_both] order-1 md:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/70 backdrop-blur-sm border border-border/60 text-muted-foreground text-xs sm:text-sm font-medium mb-4 sm:mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4A574]" />
              {i18n.hero.badge[lang]}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-foreground tracking-tight leading-[1.1] mb-4 sm:mb-6">
              {i18n.hero.title1[lang]}
              <br />
              <span className="text-primary relative">
                {i18n.hero.title2[lang]}
                <span className="absolute -bottom-1 left-0 w-full h-1 bg-primary/20 rounded-full" />
              </span>
            </h1>
            <p className="text-base sm:text-lg text-secondary-foreground leading-relaxed mb-6 sm:mb-8 max-w-lg">
              {i18n.hero.subtitle[lang]}
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                onClick={onExplore}
                className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-7 sm:py-3.5 bg-foreground text-white dark:text-background rounded-full text-sm sm:text-base font-medium hover:bg-foreground hover:shadow-lg hover:shadow-foreground/20 transition-all duration-300 active:scale-95 min-h-[48px]"
              >
                {i18n.hero.cta[lang]}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[pulse-soft_2s_ease-in-out_infinite]" />
                {t("免费使用 · 无广告", "Free & Ad-free")}
              </span>
            </div>
          </div>
          {/* Hero image */}
          <div className="relative animate-[fadeIn_1s_ease-out_0.2s_both] order-2 md:order-2">
            <div data-hero-image className="aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl shadow-foreground/12 ring-1 ring-black/5">
              <picture>
                <source srcSet={HERO_IMG_MOBILE} type="image/webp" media="(max-width: 767px)" />
                <source srcSet={HERO_IMG} type="image/webp" media="(min-width: 768px)" />
                <img
                  src={HERO_IMG_FALLBACK}
                  alt="Lovevery Play Kit Collection - Complete guide to all 22 Lovevery Play Kits with affordable Amazon alternatives"
                  className="w-full h-full object-cover"
                  fetchPriority="high"
                  decoding="sync"
                  width={640}
                  height={364}
                />
              </picture>
            </div>
            {/* Floating stat card */}
            <div className="absolute -bottom-3 -left-2 sm:-bottom-4 sm:-left-4 bg-card/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg shadow-foreground/10 ring-1 ring-black/5 animate-[fadeInUp_0.6s_ease-out_0.5s_both]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center">
                  <Baby className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-foreground">{i18n.hero.kitCount[lang]}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{i18n.hero.coverRange[lang]}</p>
                </div>
              </div>
            </div>
            {/* Decorative accent */}
            <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full blur-xl pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
