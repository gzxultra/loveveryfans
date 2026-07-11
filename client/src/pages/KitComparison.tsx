/**
 * KitComparison — Compare 2-3 Play Kits side by side.
 *
 * Users pick kits from a dropdown, then see a table/card layout comparing
 * age range, toy count, key development areas, and price. Accessible from
 * a nav link and from a direct route (/compare).
 */

import { useState, useMemo } from "react";
import { kits, type Kit } from "@/data/kits";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import {
  ArrowLeft,
  Plus,
  X,
  Baby,
  Puzzle,
  Target,
  ArrowRight,
  Scale,
} from "lucide-react";

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

const txt = {
  pageTitle: { cn: "Kit 对比", en: "Compare Kits" },
  pageSubtitle: {
    cn: "选择 2-3 个 Play Kit 进行并排对比，帮助做出最佳选择",
    en: "Select 2-3 Play Kits for a side-by-side comparison",
  },
  addKit: { cn: "添加 Kit", en: "Add Kit" },
  selectKit: { cn: "选择一个 Kit…", en: "Select a Kit…" },
  ageRange: { cn: "适用月龄", en: "Age Range" },
  toyCount: { cn: "玩具数量", en: "Toy Count" },
  devAreas: { cn: "发展领域", en: "Development Areas" },
  stage: { cn: "阶段", en: "Stage" },
  viewDetail: { cn: "查看详情", en: "View Details" },
  back: { cn: "返回首页", en: "Back to Home" },
  emptyHint: {
    cn: "点击「添加 Kit」开始对比",
    en: 'Click "Add Kit" to start comparing',
  },
  toys: { cn: "个玩具", en: "toys" },
  stageLabels: {
    baby: { cn: "婴儿", en: "Baby" },
    toddler: { cn: "幼儿", en: "Toddler" },
    bigToddler: { cn: "大幼儿", en: "Big Toddler" },
    preschool: { cn: "学前", en: "Preschool" },
  } as Record<string, { cn: string; en: string }>,
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract unique development-area categories from a kit's toys. */
function getDevAreas(kit: Kit, lang: "cn" | "en"): string[] {
  const seen = new Set<string>();
  const areas: string[] = [];
  for (const toy of kit.toys) {
    if ((toy as any).discontinued) continue;
    const label = lang === "cn" ? toy.category : (toy.categoryEn || toy.category);
    if (!seen.has(label)) {
      seen.add(label);
      areas.push(label);
    }
  }
  return areas;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MAX_COMPARE = 3;

export default function KitComparison() {
  const { lang, t } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedKits = useMemo(
    () => selectedIds.map((id) => kits.find((k) => k.id === id)!).filter(Boolean),
    [selectedIds],
  );

  const availableKits = useMemo(
    () => kits.filter((k) => !selectedIds.includes(k.id)),
    [selectedIds],
  );

  const addKit = (id: string) => {
    if (selectedIds.length < MAX_COMPARE && !selectedIds.includes(id)) {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const removeKit = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8DFD3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Link href="/">
            <span className="inline-flex items-center gap-1.5 text-sm text-[#6B5E50] hover:text-[#3D3229] transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              {txt.back[lang]}
            </span>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Scale className="w-6 h-6 text-[#7FB685]" />
            <h1 className="font-display text-2xl sm:text-3xl text-[#1a1108]">
              {txt.pageTitle[lang]}
            </h1>
          </div>
          <p className="text-sm text-[#6B5E50]">{txt.pageSubtitle[lang]}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add-kit controls */}
        {selectedIds.length < MAX_COMPARE && (
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addKit(e.target.value);
                    e.target.value = "";
                  }
                }}
                defaultValue=""
                className="rounded-xl border border-[#E8DFD3] bg-white px-4 py-2.5 text-sm text-[#3D3229] focus:outline-none focus:ring-2 focus:ring-[#7FB685]/40 min-h-[44px]"
              >
                <option value="" disabled>
                  {txt.selectKit[lang]}
                </option>
                {availableKits.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} ({lang === "cn" ? k.ageRange : (k.ageRangeEn || k.ageRange)})
                  </option>
                ))}
              </select>
              <span className="text-xs text-[#9B8E7E]">
                {selectedIds.length}/{MAX_COMPARE}
              </span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {selectedKits.length === 0 && (
          <div className="text-center py-20">
            <Scale className="w-12 h-12 text-[#D4B896] mx-auto mb-4" />
            <p className="text-sm text-[#9B8E7E]">{txt.emptyHint[lang]}</p>
          </div>
        )}

        {/* Comparison grid */}
        {selectedKits.length > 0 && (
          <div className="grid gap-4 sm:gap-6" style={{ gridTemplateColumns: `repeat(${selectedKits.length}, minmax(0, 1fr))` }}>
            {selectedKits.map((kit) => {
              const areas = getDevAreas(kit, lang);
              const stLabel =
                txt.stageLabels[kit.stage]?.[lang] ?? kit.stage;
              const activeToys = kit.toys.filter((t) => !(t as any).discontinued);

              return (
                <div
                  key={kit.id}
                  className="rounded-2xl bg-white border border-[#E8DFD3] overflow-hidden shadow-sm"
                >
                  {/* Color bar */}
                  <div
                    className="h-1.5"
                    style={{
                      background: `linear-gradient(90deg, ${kit.color}, ${kit.color}88)`,
                    }}
                  />

                  <div className="p-5 sm:p-6">
                    {/* Title + remove */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="min-w-0">
                        <h3 className="font-display text-lg text-[#1a1108] truncate">
                          {kit.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => removeKit(kit.id)}
                        className="text-[#9B8E7E] hover:text-[#3D3229] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                        aria-label="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Comparison rows */}
                    <div className="space-y-4 text-sm">
                      {/* Age */}
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-[#9B8E7E] mb-1">
                          <Baby className="w-3.5 h-3.5" />
                          {txt.ageRange[lang]}
                        </div>
                        <p className="font-medium text-[#3D3229]">
                          {lang === "cn"
                            ? t(kit.ageRange, kit.ageRangeEn || kit.ageRange)
                            : (kit.ageRangeEn || kit.ageRange)}
                        </p>
                      </div>

                      {/* Stage */}
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-[#9B8E7E] mb-1">
                          <Target className="w-3.5 h-3.5" />
                          {txt.stage[lang]}
                        </div>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
                          style={{
                            backgroundColor: kit.color + "12",
                            color: kit.color,
                            borderColor: kit.color + "30",
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: kit.color }}
                          />
                          {stLabel}
                        </span>
                      </div>

                      {/* Toy count */}
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-[#9B8E7E] mb-1">
                          <Puzzle className="w-3.5 h-3.5" />
                          {txt.toyCount[lang]}
                        </div>
                        <p className="font-medium text-[#3D3229]">
                          {activeToys.length} {txt.toys[lang]}
                        </p>
                      </div>

                      {/* Development areas */}
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-[#9B8E7E] mb-1.5">
                          <Target className="w-3.5 h-3.5" />
                          {txt.devAreas[lang]}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {areas.map((a) => (
                            <span
                              key={a}
                              className="px-2 py-0.5 rounded-full bg-[#F0EBE3] text-[10px] text-[#6B5E50]"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* View detail link */}
                    <Link href={`/kit/${kit.id}/`}>
                      <span
                        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium hover:gap-2.5 transition-all"
                        style={{ color: kit.color }}
                      >
                        {txt.viewDetail[lang]}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
