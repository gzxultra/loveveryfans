/**
 * KitCard — A card representing a single Play Kit on the Home grid.
 *
 * Extracted from Home.tsx for maintainability.
 */

import { memo } from "react";
import { type Kit } from "@/data/kits";
import { getKitHeroImage } from "@/data/toyImages";
import { getKitCardThumbnailUrl, getAccessibleTextColor } from "@/lib/imageUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useI18n } from "@/hooks/useI18n";
import { useFavorites } from "@/hooks/useFavorites";
import LikeButton from "@/components/LikeButton";
import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "wouter";

interface KitCardProps {
  kit: Kit;
  onPrefetch: () => void;
}

const KitCard = memo(function KitCard({ kit, onPrefetch }: KitCardProps) {
  const { lang, t } = useLanguage();
  const i18n = useI18n();
  const { isFavorite, toggleFavorite, getLikeCount } = useFavorites();
  const kitHero = getKitHeroImage(kit.id);

  return (
    <Link href={`/kit/${kit.id}/`}>
      <div
        className="group relative rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-[#E8DFD3] hover:border-[#C8BFB3] hover:shadow-2xl hover:shadow-[#3D3229]/12 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer h-full active:scale-[0.98] card-glow"
        onMouseEnter={onPrefetch}
        onTouchStart={onPrefetch}
      >
        {/* Color accent bar with gradient */}
        <div
          className="h-1 sm:h-1.5 w-full"
          style={{ background: `linear-gradient(90deg, ${kit.color}, ${kit.color}88)` }}
        />
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg sm:text-xl text-[#1a1108] mb-1 truncate group-hover:text-[#3D3229] transition-colors">
                {kit.name}
              </h3>
              <p className="text-xs sm:text-sm text-[#5A4E42]">
                {lang === "cn" ? t(kit.ageRange, kit.ageRangeEn || kit.ageRange) : (kit.ageRangeEn || kit.ageRange)}
              </p>
            </div>
            {kitHero ? (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-[#FAF7F2] border border-[#F0EBE3] p-1 group-hover:border-[#E8DFD3] group-hover:shadow-sm transition-all">
                <img
                  src={getKitCardThumbnailUrl(kitHero)}
                  alt={`${kit.name} Play Kit - Lovevery educational toys for ${kit.ageRangeEn || kit.ageRange}`}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  width={128}
                  height={128}
                  decoding="async"
                />
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: kit.color + "15" }}
              >
                <BookOpen className="w-5 h-5" style={{ color: kit.color }} />
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm text-[#5A4E42] leading-relaxed line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4">
            {lang === "cn" ? t(kit.description, kit.descriptionEn || kit.description) : (kit.descriptionEn || kit.description)}
          </p>

          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-[#F0EBE3] group-hover:border-[#E8DFD3] transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6B5E50] flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full" style={{ backgroundColor: kit.color }} />
                {kit.toys.length} {i18n.kitCard.toys[lang]}
              </span>
              <LikeButton
                kitId={kit.id}
                isLiked={isFavorite(kit.id)}
                likeCount={getLikeCount(kit.id)}
                onToggle={toggleFavorite}
                variant="icon"
              />
            </div>
            <span
              className="text-xs sm:text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all min-h-[48px] min-w-[48px] justify-end"
              style={{ color: getAccessibleTextColor(kit.color) }}
            >
              {i18n.kitCard.viewDetails[lang]}
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
});

export default KitCard;
