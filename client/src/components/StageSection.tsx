/**
 * StageSection — A stage header and its Kit cards grid.
 *
 * Extracted from Home.tsx for maintainability.
 */

import { kits } from "@/data/kits";
import { getAccessibleTextColor } from "@/lib/imageUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useI18n } from "@/hooks/useI18n";
import KitCard from "@/components/KitCard";

interface StageSectionProps {
  stage: { id: string; label: string; range: string; color: string };
  onPrefetchKitDetail: () => void;
}

export default function StageSection({ stage, onPrefetchKitDetail }: StageSectionProps) {
  const { lang } = useLanguage();
  const i18n = useI18n();

  const stageLabel = (() => {
    const key = stage.id as keyof typeof i18n.stages;
    return i18n.stages[key]?.[lang] ?? stage.id;
  })();

  const stageRange = (() => {
    const key = stage.id as keyof typeof i18n.stageRanges;
    return i18n.stageRanges[key]?.[lang] ?? "";
  })();

  const stageKits = kits.filter((k) => k.stage === stage.id);

  return (
    <section id={`stage-${stage.id}`} className="py-10 sm:py-16 md:py-24 scroll-mt-16 sm:scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stage Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8">
            <div className="shrink-0">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 border"
                style={{
                  backgroundColor: stage.color + "12",
                  color: getAccessibleTextColor(stage.color),
                  borderColor: stage.color + "25",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
                {stageRange}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#1a1108] tracking-tight">
                {stageLabel}
              </h2>
            </div>
            <div className="hidden sm:block flex-1 h-px bg-gradient-to-r from-[#E8DFD3] via-[#E8DFD3]/50 to-transparent" />
          </div>
        </div>

        {/* Kit Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {stageKits.map((kit) => (
            <KitCard key={kit.id} kit={kit} onPrefetch={onPrefetchKitDetail} />
          ))}
        </div>
      </div>
    </section>
  );
}
