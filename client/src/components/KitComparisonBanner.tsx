/**
 * KitComparisonBanner — A compact comparison section showing prev/next kits
 * with key stats, helping parents understand the progression between kits.
 */
import { kits } from "@/data/kits";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { Puzzle, BookOpen } from "lucide-react";

interface KitComparisonBannerProps {
  currentKitId: string;
}

export default function KitComparisonBanner({ currentKitId }: KitComparisonBannerProps) {
  const { lang, t } = useLanguage();
  const currentIndex = kits.findIndex((k) => k.id === currentKitId);
  if (currentIndex === -1) return null;

  const currentKit = kits[currentIndex];
  const prevKit = currentIndex > 0 ? kits[currentIndex - 1] : null;
  const nextKit = currentIndex < kits.length - 1 ? kits[currentIndex + 1] : null;

  if (!prevKit && !nextKit) return null;

  const getActiveToyCount = (kit: typeof currentKit) =>
    kit.toys.filter((t) => !(t as any).discontinued).length;

  const getCategoryCount = (kit: typeof currentKit) =>
    new Set(
      kit.toys
        .filter((t) => !(t as any).discontinued)
        .flatMap((t) => (t.category || "").split("/"))
        .filter(Boolean)
    ).size;

  return (
    <div className="bg-gradient-to-r from-[#FAF7F2] via-white to-[#FAF7F2] rounded-xl border border-[#E8DFD3] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#F0EBE3]">
        <h3 className="text-xs font-semibold text-[#6B5E50] uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          {t("Kit 对比", "Kit Comparison")}
        </h3>
      </div>
      <div className="grid grid-cols-3 divide-x divide-[#F0EBE3]">
        {/* Previous Kit */}
        <div className="p-3 sm:p-4">
          {prevKit ? (
            <Link href={`/kit/${prevKit.id}/`}>
              <div className="group cursor-pointer">
                <p className="text-[10px] text-[#B0A89E] mb-1">{t("上一个", "Previous")}</p>
                <p className="text-xs sm:text-sm font-medium text-[#3D3229] group-hover:text-[#1a1108] transition-colors truncate">
                  {prevKit.name}
                </p>
                <p className="text-[10px] text-[#756A5C] mt-1">
                  {getActiveToyCount(prevKit)} {t("个玩具", "toys")}
                </p>
              </div>
            </Link>
          ) : (
            <div className="text-[10px] text-[#C8BFB3] italic">
              {t("这是第一个 Kit", "First Kit")}
            </div>
          )}
        </div>

        {/* Current Kit */}
        <div className="p-3 sm:p-4 bg-[#FAF7F2]/50">
          <p className="text-[10px] text-[#B0A89E] mb-1">{t("当前", "Current")}</p>
          <p
            className="text-xs sm:text-sm font-bold truncate"
            style={{ color: currentKit.color }}
          >
            {currentKit.name}
          </p>
          <p className="text-[10px] text-[#756A5C] mt-1">
            {getActiveToyCount(currentKit)} {t("个玩具", "toys")} · {getCategoryCount(currentKit)} {t("个类别", "categories")}
          </p>
        </div>

        {/* Next Kit */}
        <div className="p-3 sm:p-4">
          {nextKit ? (
            <Link href={`/kit/${nextKit.id}/`}>
              <div className="group cursor-pointer text-right">
                <p className="text-[10px] text-[#B0A89E] mb-1">{t("下一个", "Next")}</p>
                <p className="text-xs sm:text-sm font-medium text-[#3D3229] group-hover:text-[#1a1108] transition-colors truncate">
                  {nextKit.name}
                </p>
                <p className="text-[10px] text-[#756A5C] mt-1">
                  {getActiveToyCount(nextKit)} {t("个玩具", "toys")}
                </p>
              </div>
            </Link>
          ) : (
            <div className="text-[10px] text-[#C8BFB3] italic text-right">
              {t("这是最后一个 Kit", "Last Kit")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
