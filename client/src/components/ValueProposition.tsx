/**
 * ValueProposition — Highlights loveveryfans.com's 3 core differentiators.
 *
 * Placed prominently on the Home page to immediately communicate the site's
 * unique value: bilingual guides, savings calculator, and per-toy alternatives.
 */

import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, Calculator, Search } from "lucide-react";

const features = [
  {
    icon: Globe,
    color: "#6C8EAD",
    title: { cn: "🌏 双语指南", en: "🌏 Bilingual Guide" },
    desc: {
      cn: "唯一的中英文 Lovevery 完全指南，164 个玩具逐一详解使用方法和发展目标",
      en: "The only Chinese-English Lovevery guide with detailed how-to-use and developmental goals for all 164 toys",
    },
  },
  {
    icon: Calculator,
    color: "#7FB685",
    title: { cn: "💰 省钱计算器", en: "💰 Savings Calculator" },
    desc: {
      cn: "对比 Lovevery 原价 vs Amazon 平替总价，帮你找出最具性价比的购买方案",
      en: "Compare Lovevery retail vs Amazon alternatives side-by-side to find your best-value buying strategy",
    },
  },
  {
    icon: Search,
    color: "#E8A87C",
    title: { cn: "🔍 逐玩具平替", en: "🔍 Per-Toy Alternatives" },
    desc: {
      cn: "不是笼统推荐「替代整个 Kit」，而是为每个玩具精选高评分、材质安全的 Amazon 平替",
      en: "Not just \"replace the whole Kit\" — curated, highly-rated Amazon alternatives for every single toy",
    },
  },
] as const;

export default function ValueProposition() {
  const { lang } = useLanguage();

  return (
    <section className="py-8 sm:py-12 bg-[#FAF7F2]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="group relative rounded-xl sm:rounded-2xl bg-white border border-[#E8DFD3] p-5 sm:p-6 hover:border-[#C8BFB3] hover:shadow-lg hover:shadow-[#3D3229]/5 transition-all duration-300"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: f.color + "12" }}
                >
                  <Icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-display text-base sm:text-lg text-[#1a1108] mb-1.5">
                  {f.title[lang]}
                </h3>
                <p className="text-xs sm:text-sm text-[#6B5E50] leading-relaxed">
                  {f.desc[lang]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
