/**
 * Footer — Shared site footer (Home, KitDetail, Blog all use this).
 *
 * Based on the full 4-column Home footer: brand / development stages /
 * standalone products / about guide, plus the bottom bar with tagline,
 * affiliate disclaimer, share message and the rainbow easter-egg portal.
 *
 * The "development stages" column scrolls to the stage section on the Home
 * page (via the optional `onStageClick` prop); on other pages the stages
 * link back to the home guide where the stages live.
 */
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { stages } from "@/data/kits";
import { standaloneProducts, getProductSlug } from "@/data/standaloneProducts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useI18n } from "@/hooks/useI18n";
import { FooterShareMessage } from "@/components/ShareSection";

interface FooterProps {
  /** Home page passes its smooth-scroll handler; other pages link back to "/". */
  onStageClick?: (stageId: string) => void;
}

export default function Footer({ onStageClick }: FooterProps) {
  const { lang } = useLanguage();
  const i18n = useI18n();

  const stageLabel = (id: string) => {
    const key = id as keyof typeof i18n.stages;
    return i18n.stages[key]?.[lang] ?? id;
  };
  const stageRange = (id: string) => {
    const key = id as keyof typeof i18n.stageRanges;
    return i18n.stageRanges[key]?.[lang] ?? "";
  };

  return (
    <footer className="relative bg-foreground text-white py-10 sm:py-16">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          <div>
            <h3 data-logo-target className="font-display text-xl sm:text-2xl mb-3 sm:mb-4 select-none">Lovevery</h3>
            <p className="text-[#B8AFA3] text-sm leading-relaxed">
              {i18n.footer.brandDesc[lang]}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-border">{i18n.footer.devStages[lang]}</h4>
            <ul className="space-y-1">
              {stages.map((s) => (
                <li key={s.id}>
                  {onStageClick ? (
                    <button
                      onClick={() => onStageClick(s.id)}
                      className="text-sm text-[#B8AFA3] hover:text-white hover:translate-x-1 transition-all duration-200 min-h-[44px] flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                      {stageLabel(s.id)} ({stageRange(s.id)})
                    </button>
                  ) : (
                    <Link href="/">
                      <span className="text-sm text-[#B8AFA3] hover:text-white hover:translate-x-1 transition-all duration-200 min-h-[44px] flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                        {stageLabel(s.id)} ({stageRange(s.id)})
                      </span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-border">{i18n.nav.products[lang]}</h4>
            <ul className="space-y-1">
              {standaloneProducts.map((p) => (
                <li key={p.id}>
                  <Link href={`/product/${getProductSlug(p.id)}/`}>
                    <span className="text-sm text-[#B8AFA3] hover:text-white hover:translate-x-1 transition-all duration-200 min-h-[44px] flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                      {p.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="sm:col-span-2 md:col-span-1">
            <h4 className="font-semibold mb-3 sm:mb-4 text-border">{i18n.footer.aboutGuide[lang]}</h4>
            <p className="text-sm text-[#B8AFA3] leading-relaxed mb-4">
              {i18n.footer.aboutDesc[lang]}
            </p>
            <Link href="/about/">
              <span className="inline-flex items-center gap-1.5 text-sm text-[#B8AFA3] hover:text-white transition-colors group">
                {i18n.nav.aboutUs[lang]}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-secondary-foreground/80 text-center">
          <p className="text-xs sm:text-sm text-[#9A8E82] mb-2">
            {i18n.footer.tagline[lang]}
          </p>
          <p className="text-xs sm:text-sm text-[#9A8E82] leading-relaxed max-w-4xl mx-auto">
            {i18n.footer.disclaimer[lang]}
          </p>
          <FooterShareMessage />
          <div data-rainbow-portal className="mt-3 flex justify-center" />
        </div>
      </div>
    </footer>
  );
}
