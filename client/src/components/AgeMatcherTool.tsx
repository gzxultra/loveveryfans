/**
 * AgeMatcherTool — "Find Your Kit" / "找到宝宝的 Kit"
 *
 * A bilingual age-matching tool placed prominently on the Home page.
 * Users can either enter their baby's birth date or manually select a month
 * range. The component calculates the child's age in months, then recommends
 * the corresponding Play Kit with a one-click link to its detail page.
 */

import { useState, useMemo, useCallback } from "react";
import { kits, type Kit } from "@/data/kits";
import { useLanguage } from "@/contexts/LanguageContext";
import { Baby, Calendar, ArrowRight, Sparkles, Gift } from "lucide-react";
import { Link } from "wouter";

// ---------------------------------------------------------------------------
// Age → Kit mapping (mirrors AgePickerNav ranges)
// ---------------------------------------------------------------------------

interface AgeRange {
  minMonths: number;
  maxMonths: number;
  kitId: string;
}

const AGE_KIT_MAP: AgeRange[] = [
  { minMonths: 0, maxMonths: 2, kitId: "looker" },
  { minMonths: 3, maxMonths: 4, kitId: "charmer" },
  { minMonths: 5, maxMonths: 6, kitId: "senser" },
  { minMonths: 7, maxMonths: 8, kitId: "inspector" },
  { minMonths: 9, maxMonths: 10, kitId: "explorer" },
  { minMonths: 11, maxMonths: 12, kitId: "thinker" },
  { minMonths: 13, maxMonths: 15, kitId: "babbler" },
  { minMonths: 16, maxMonths: 18, kitId: "adventurer" },
  { minMonths: 19, maxMonths: 21, kitId: "realist" },
  { minMonths: 22, maxMonths: 24, kitId: "companion" },
  { minMonths: 25, maxMonths: 27, kitId: "helper" },
  { minMonths: 28, maxMonths: 30, kitId: "enthusiast" },
  { minMonths: 31, maxMonths: 33, kitId: "researcher" },
  { minMonths: 34, maxMonths: 36, kitId: "freeSpirit" },
  { minMonths: 37, maxMonths: 39, kitId: "observer" },
  { minMonths: 40, maxMonths: 42, kitId: "storyteller" },
  { minMonths: 43, maxMonths: 45, kitId: "problemSolver" },
  { minMonths: 46, maxMonths: 48, kitId: "analyst" },
  { minMonths: 49, maxMonths: 51, kitId: "connector" },
  { minMonths: 52, maxMonths: 54, kitId: "examiner" },
  { minMonths: 55, maxMonths: 57, kitId: "persister" },
  { minMonths: 58, maxMonths: 60, kitId: "planner" },
];

function getKitForMonths(months: number): Kit | null {
  const entry = AGE_KIT_MAP.find(
    (r) => months >= r.minMonths && months <= r.maxMonths,
  );
  if (!entry) return null;
  return kits.find((k) => k.id === entry.kitId) ?? null;
}

function monthsBetween(birthDate: Date, today: Date): number {
  let months =
    (today.getFullYear() - birthDate.getFullYear()) * 12 +
    (today.getMonth() - birthDate.getMonth());
  if (today.getDate() < birthDate.getDate()) months -= 1;
  return Math.max(0, months);
}

// ---------------------------------------------------------------------------
// i18n strings
// ---------------------------------------------------------------------------

const txt = {
  title: { cn: "找到宝宝的 Play Kit", en: "Find Your Baby's Play Kit" },
  subtitle: {
    cn: "输入宝宝的出生日期，我们帮你匹配最适合的 Kit",
    en: "Enter your baby's birth date to find the perfect Kit",
  },
  birthLabel: { cn: "宝宝出生日期", en: "Baby's Birth Date" },
  orLabel: { cn: "或选择月龄", en: "or select age in months" },
  monthsLabel: { cn: "月龄", en: "months old" },
  resultTitle: { cn: "推荐给你的 Kit", en: "Recommended Kit for You" },
  resultAge: { cn: "宝宝 {months} 个月", en: "Your baby is {months} months old" },
  viewKit: { cn: "查看详情", en: "View Details" },
  tooOld: {
    cn: "宝宝已超过 60 个月（5 岁），Lovevery Play Kit 覆盖 0-60 个月",
    en: "Your baby is over 60 months (5 years). Lovevery Play Kits cover ages 0-60 months.",
  },
  notBorn: {
    cn: "宝宝还没出生呢！出生后再来看看 😊",
    en: "Your baby hasn't arrived yet! Come back after birth 😊",
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type InputMode = "date" | "slider";

export default function AgeMatcherTool() {
  const { lang, t } = useLanguage();
  const [mode, setMode] = useState<InputMode>("date");
  const [birthDate, setBirthDate] = useState("");
  const [sliderMonths, setSliderMonths] = useState(6);

  const today = useMemo(() => new Date(), []);

  // Compute age in months from birth date
  const computedMonths = useMemo(() => {
    if (mode !== "date" || !birthDate) return null;
    const bd = new Date(birthDate + "T00:00:00");
    if (isNaN(bd.getTime())) return null;
    if (bd > today) return -1; // not born yet
    return monthsBetween(bd, today);
  }, [birthDate, mode, today]);

  const activeMonths = mode === "date" ? computedMonths : sliderMonths;

  const matchedKit = useMemo(() => {
    if (activeMonths === null || activeMonths < 0) return null;
    return getKitForMonths(activeMonths);
  }, [activeMonths]);

  const statusMessage = useMemo(() => {
    if (activeMonths === null) return null;
    if (activeMonths < 0) return txt.notBorn[lang];
    if (activeMonths > 60) return txt.tooOld[lang];
    return null;
  }, [activeMonths, lang]);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBirthDate(e.target.value);
    setMode("date");
  }, []);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderMonths(Number(e.target.value));
    setMode("slider");
  }, []);

  return (
    <section className="py-8 sm:py-12 bg-gradient-to-br from-[#F8F3ED] via-[#FAF7F2] to-[#FFF8F0]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E8DFD3] shadow-lg shadow-[#3D3229]/5 overflow-hidden">
          {/* Header */}
          <div className="px-5 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-5 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7FB685]/10 text-[#4a8a54] text-xs sm:text-sm font-medium mb-3 border border-[#7FB685]/20">
              <Baby className="w-3.5 h-3.5" />
              {txt.title[lang]}
            </div>
            <p className="text-sm text-[#6B5E50] max-w-md mx-auto">
              {txt.subtitle[lang]}
            </p>
          </div>

          {/* Input area */}
          <div className="px-5 pb-4 sm:px-8 sm:pb-5 space-y-5">
            {/* Birth date input */}
            <div className="space-y-1.5">
              <label
                htmlFor="birth-date"
                className="block text-xs font-medium text-[#6B5E50] pl-1"
              >
                <Calendar className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
                {txt.birthLabel[lang]}
              </label>
              <input
                id="birth-date"
                type="date"
                value={birthDate}
                onChange={handleDateChange}
                max={today.toISOString().split("T")[0]}
                className="w-full rounded-xl border border-[#E8DFD3] bg-[#FAF7F2] px-4 py-3 text-sm text-[#3D3229] focus:outline-none focus:ring-2 focus:ring-[#7FB685]/40 focus:border-[#7FB685]/60 transition-all"
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#E8DFD3]" />
              <span className="text-xs text-[#9B8E7E] font-medium">
                {txt.orLabel[lang]}
              </span>
              <div className="flex-1 h-px bg-[#E8DFD3]" />
            </div>

            {/* Month slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#6B5E50]">
                  0 {t("个月", "mo")}
                </span>
                <span className="text-sm font-semibold text-[#3D3229] tabular-nums">
                  {sliderMonths} {txt.monthsLabel[lang]}
                </span>
                <span className="text-xs font-medium text-[#6B5E50]">
                  60 {t("个月", "mo")}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                value={sliderMonths}
                onChange={handleSliderChange}
                className="w-full h-2 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#7FB685] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#7FB685] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #7FB685 ${(sliderMonths / 60) * 100}%, #E8DFD3 ${(sliderMonths / 60) * 100}%)`,
                }}
              />
            </div>
          </div>

          {/* Result */}
          {statusMessage && (
            <div className="mx-5 mb-5 sm:mx-8 sm:mb-6 p-4 rounded-xl bg-[#FFF5EE] border border-[#E8A87C]/20 text-sm text-[#8B6914]">
              {statusMessage}
            </div>
          )}

          {matchedKit && !statusMessage && (
            <div className="mx-5 mb-5 sm:mx-8 sm:mb-6">
              <div
                className="p-4 sm:p-5 rounded-xl border transition-all"
                style={{
                  backgroundColor: matchedKit.color + "08",
                  borderColor: matchedKit.color + "25",
                }}
              >
                <div className="flex items-center gap-1.5 text-xs text-[#6B5E50] mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4A574]" />
                  {txt.resultTitle[lang]}
                </div>

                {activeMonths !== null && (
                  <p className="text-xs text-[#9B8E7E] mb-3">
                    {txt.resultAge[lang].replace(
                      "{months}",
                      String(activeMonths),
                    )}
                  </p>
                )}

                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg sm:text-xl text-[#1a1108] truncate">
                      {matchedKit.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5A4E42] mt-0.5">
                      {lang === "cn"
                        ? t(
                            matchedKit.ageRange,
                            matchedKit.ageRangeEn || matchedKit.ageRange,
                          )
                        : matchedKit.ageRangeEn || matchedKit.ageRange}{" "}
                      · {matchedKit.toys.length}{" "}
                      {t("个玩具", "toys")}
                    </p>
                  </div>

                  <Link href={`/kit/${matchedKit.id}/`}>
                    <span
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-white text-sm font-medium whitespace-nowrap hover:shadow-md transition-all active:scale-95 min-h-[44px]"
                      style={{ backgroundColor: matchedKit.color }}
                    >
                      {txt.viewKit[lang]}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
