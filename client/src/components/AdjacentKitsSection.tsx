/**
 * AdjacentKitsSection — Internal linking component for Kit detail pages.
 *
 * Shows kits from the same developmental stage (adjacent age groups),
 * creating an internal link network that helps both users discover
 * related content and search engines understand site structure.
 *
 * Displays up to 4 kits: the 2 immediately before and 2 immediately after
 * the current kit in the ordered kits array.
 */

import { Link } from "wouter";
import { kits, type Kit } from "@/data/kits";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronRight } from "lucide-react";

interface AdjacentKitsSectionProps {
  currentKitId: string;
}

/**
 * Get up to `count` adjacent kits on each side of the current kit.
 */
export function getAdjacentKits(
  currentKitId: string,
  count = 2
): { before: Kit[]; after: Kit[] } {
  const idx = kits.findIndex((k) => k.id === currentKitId);
  if (idx === -1) return { before: [], after: [] };

  const before = kits.slice(Math.max(0, idx - count), idx);
  const after = kits.slice(idx + 1, Math.min(kits.length, idx + 1 + count));

  return { before, after };
}

export function AdjacentKitsSection({ currentKitId }: AdjacentKitsSectionProps) {
  const { lang } = useLanguage();
  const { before, after } = getAdjacentKits(currentKitId, 2);
  const adjacent = [...before, ...after];

  if (adjacent.length === 0) return null;

  const heading =
    lang === "cn" ? "相邻月龄推荐" : "You Might Also Like";
  const subheading =
    lang === "cn"
      ? "探索相邻月龄的 Lovevery Play Kit"
      : "Explore Lovevery Play Kits for nearby age ranges";

  return (
    <section
      aria-labelledby="adjacent-kits-heading"
      className="py-6 sm:py-8"
    >
      <div className="mb-4 sm:mb-6">
        <h2
          id="adjacent-kits-heading"
          className="font-display text-lg sm:text-xl text-[#3D3229] font-semibold"
        >
          {heading}
        </h2>
        <p className="text-sm text-[#756A5C] mt-1">{subheading}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {adjacent.map((kit) => (
          <Link
            key={kit.id}
            href={`/kit/${kit.id}/`}
            aria-label={`${kit.name} — ${lang === "en" && kit.ageRangeEn ? kit.ageRangeEn : kit.ageRange}`}
          >
            <div
              className="group relative p-3 sm:p-4 rounded-xl border border-[#E8DFD3] hover:border-[#C8BFB3] bg-white hover:shadow-md hover:shadow-[#3D3229]/5 transition-all duration-200 cursor-pointer h-full flex flex-col gap-2"
              style={{ borderLeftColor: kit.color, borderLeftWidth: 3 }}
            >
              {/* Color accent dot */}
              <div
                className="w-6 h-6 rounded-full shrink-0"
                style={{ backgroundColor: kit.bgColor || kit.color + "20" }}
                aria-hidden="true"
              />

              {/* Kit name */}
              <p className="font-display text-sm font-semibold text-[#3D3229] group-hover:text-[#1a1108] transition-colors line-clamp-2 leading-tight">
                {kit.name}
              </p>

              {/* Age range */}
              <p className="text-[11px] text-[#756A5C] mt-auto">
                {lang === "en" && kit.ageRangeEn ? kit.ageRangeEn : kit.ageRange}
              </p>

              {/* Arrow indicator */}
              <ChevronRight
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C8BFB3] group-hover:text-[#756A5C] group-hover:translate-x-0.5 transition-all"
                aria-hidden="true"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
