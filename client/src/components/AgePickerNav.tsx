/**
 * AgePickerNav — A visual age-based timeline navigation component.
 * Allows parents to quickly find the right Play Kit by selecting their child's age.
 * Renders as a horizontal scrollable timeline on mobile, full bar on desktop.
 */
import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { kits } from "@/data/kits";
import { Link } from "wouter";
import { Baby, ChevronRight } from "lucide-react";

interface AgePickerNavProps {
  onClose?: () => void;
}

const AGE_RANGES = [
  { label: "0-3m", labelCn: "0-3月", months: [0, 3], kitIds: ["looker"] },
  { label: "3-4m", labelCn: "3-4月", months: [3, 4], kitIds: ["charmer"] },
  { label: "5-6m", labelCn: "5-6月", months: [5, 6], kitIds: ["senser"] },
  { label: "7-8m", labelCn: "7-8月", months: [7, 8], kitIds: ["inspector"] },
  { label: "9-10m", labelCn: "9-10月", months: [9, 10], kitIds: ["explorer"] },
  { label: "11-12m", labelCn: "11-12月", months: [11, 12], kitIds: ["thinker"] },
  { label: "13-15m", labelCn: "13-15月", months: [13, 15], kitIds: ["babbler"] },
  { label: "16-18m", labelCn: "16-18月", months: [16, 18], kitIds: ["adventurer"] },
  { label: "19-21m", labelCn: "19-21月", months: [19, 21], kitIds: ["realist"] },
  { label: "22-24m", labelCn: "22-24月", months: [22, 24], kitIds: ["companion"] },
  { label: "25-27m", labelCn: "25-27月", months: [25, 27], kitIds: ["helper"] },
  { label: "28-30m", labelCn: "28-30月", months: [28, 30], kitIds: ["enthusiast"] },
  { label: "31-33m", labelCn: "31-33月", months: [31, 33], kitIds: ["researcher"] },
  { label: "34-36m", labelCn: "34-36月", months: [34, 36], kitIds: ["freeSpirit"] },
  { label: "37-39m", labelCn: "37-39月", months: [37, 39], kitIds: ["observer"] },
  { label: "40-42m", labelCn: "40-42月", months: [40, 42], kitIds: ["storyteller"] },
  { label: "43-45m", labelCn: "43-45月", months: [43, 45], kitIds: ["problemSolver"] },
  { label: "46-48m", labelCn: "46-48月", months: [46, 48], kitIds: ["analyst"] },
  { label: "49-51m", labelCn: "49-51月", months: [49, 51], kitIds: ["connector"] },
  { label: "52-54m", labelCn: "52-54月", months: [52, 54], kitIds: ["examiner"] },
  { label: "55-57m", labelCn: "55-57月", months: [55, 57], kitIds: ["persister"] },
  { label: "58-60m", labelCn: "58-60月", months: [58, 60], kitIds: ["planner"] },
];

const STAGE_COLORS: Record<string, string> = {
  baby: "#E8A87C",
  toddler: "#85CDCA",
  bigToddler: "#D4A574",
  preschool: "#7FB685",
};

export default function AgePickerNav({ onClose }: AgePickerNavProps) {
  const { lang, t } = useLanguage();
  const [selectedAge, setSelectedAge] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getStageForKit = (kitId: string) => {
    const kit = kits.find((k) => k.id === kitId);
    return kit?.stage || "baby";
  };

  const selectedKit = selectedAge !== null
    ? kits.find((k) => k.id === AGE_RANGES[selectedAge]?.kitIds[0])
    : null;

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#E8DFD3] shadow-xl shadow-[#3D3229]/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#F0EBE3] flex items-center gap-2">
        <Baby className="w-4 h-4 text-[#7FB685]" />
        <span className="text-sm font-medium text-[#3D3229]">
          {t("按月龄查找 Play Kit", "Find Play Kit by Age")}
        </span>
      </div>

      {/* Timeline */}
      <div
        ref={scrollRef}
        className="px-3 py-3 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex gap-1 min-w-max">
          {AGE_RANGES.map((range, idx) => {
            const stage = getStageForKit(range.kitIds[0]);
            const color = STAGE_COLORS[stage] || "#7FB685";
            const isSelected = selectedAge === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedAge(isSelected ? null : idx)}
                className={`px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  isSelected
                    ? "text-white shadow-md scale-105"
                    : "text-[#6B5E50] hover:bg-[#F0EBE3] bg-[#FAF7F2]"
                }`}
                style={isSelected ? { backgroundColor: color } : undefined}
              >
                {lang === "cn" ? range.labelCn : range.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Kit Preview */}
      {selectedKit && selectedAge !== null && (
        <div className="px-4 pb-3 animate-[fadeIn_0.2s_ease-out]">
          <Link href={`/kit/${selectedKit.id}/`} onClick={onClose}>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F0EBE3] transition-colors group cursor-pointer">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#3D3229] truncate">
                  {selectedKit.name}
                </p>
                <p className="text-xs text-[#6B5E50]">
                  {lang === "cn" ? selectedKit.ageRange : (selectedKit.ageRangeEn || selectedKit.ageRange)}
                  {" · "}
                  {selectedKit.toys.filter((t) => !(t as any).discontinued).length} {t("个玩具", "toys")}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6B5E50] group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
