/*
 * CommunitySubmissions – Displays approved user-submitted articles.
 * Shows a "Community Pick" badge for each article.
 * Fetches from the submissions API and integrates with the reading section.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Users, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackEvent } from "@/lib/analytics";

const SUBMISSIONS_API_URL = import.meta.env.VITE_SUBSCRIBE_API_URL || "";

const i18n = {
  sectionTitle: { cn: "社区推荐", en: "Community Picks" },
  sectionSubtitle: {
    cn: "来自社区家长们的精选推荐",
    en: "Curated recommendations from fellow parents",
  },
  badge: { cn: "社区推荐", en: "Community Pick" },
  by: { cn: "推荐人", en: "Shared by" },
  anonymous: { cn: "匿名用户", en: "Anonymous" },
  noSubmissions: { cn: "暂无社区推荐", en: "No community picks yet" },
  beFirst: {
    cn: "成为第一个推荐文章的人吧！",
    en: "Be the first to recommend an article!",
  },
} as const;

export interface Submission {
  id: number;
  kit_id: string;
  url: string;
  title: string | null;
  description: string | null;
  author_name: string | null;
  submitted_at: string;
}

interface Props {
  kitId: string;
  kitColor: string;
}

export function CommunitySubmissions({ kitId, kitColor }: Props) {
  const { lang, convert } = useLanguage();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubmissions() {
      if (!SUBMISSIONS_API_URL) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `${SUBMISSIONS_API_URL}/api/submissions?kit_id=${encodeURIComponent(kitId)}&status=approved`,
        );
        if (res.ok) {
          const data = await res.json();
          setSubmissions(data.submissions || []);
        }
      } catch {
        // Silently fail – community picks are non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchSubmissions();
  }, [kitId]);

  const t = (key: keyof typeof i18n) =>
    lang === "cn" ? convert(i18n[key].cn) : i18n[key].en;

  // Don't render anything if no API configured and no submissions
  if (!SUBMISSIONS_API_URL || (submissions.length === 0 && !loading)) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-6 sm:mt-8">
        <div className="animate-pulse space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-[#E8DFD3]/40"
            />
          ))}
        </div>
      </div>
    );
  }

  if (submissions.length === 0) return null;

  return (
    <div className="mt-6 sm:mt-8">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: kitColor + "15" }}
        >
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: kitColor }} />
        </div>
        <h3 className="text-sm sm:text-base font-semibold text-[#3D3229]">
          {t("sectionTitle")}
        </h3>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8DFD3] text-[#6B5E50]">
          {submissions.length}
        </span>
      </div>

      {/* Submission cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {submissions.map((submission, idx) => (
            <motion.a
              key={submission.id}
              href={submission.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              onClick={() =>
                trackEvent("click_community_submission", {
                  submission_id: submission.id,
                  kit_id: kitId,
                })
              }
              className="group block rounded-xl border border-[#E8DFD3] bg-white hover:border-[#C8BFB3] hover:shadow-md hover:shadow-[#3D3229]/5 transition-all duration-300 overflow-hidden"
            >
              {/* Community Pick badge */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-xs font-semibold tracking-wide"
                style={{ backgroundColor: kitColor + "0C", color: kitColor }}
              >
                <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {t("badge")}
              </div>

              <div className="p-3.5 sm:p-4">
                {/* Title */}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm sm:text-base font-medium text-[#3D3229] group-hover:text-[#1a1510] transition-colors line-clamp-2 flex-1">
                    {submission.title || submission.url}
                  </h4>
                  <ExternalLink className="w-3.5 h-3.5 text-[#C8BFB3] group-hover:text-[#9B8E7E] shrink-0 mt-0.5 transition-colors" />
                </div>

                {/* Description */}
                {submission.description && (
                  <p className="mt-1.5 text-xs sm:text-sm text-[#6B5E50] line-clamp-2">
                    {submission.description}
                  </p>
                )}

                {/* Meta info */}
                <div className="mt-2 flex items-center gap-3 text-[10px] sm:text-xs text-[#9B8E7E]">
                  {submission.author_name && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {t("by")} {submission.author_name}
                    </span>
                  )}
                  <span>
                    {new Date(submission.submitted_at).toLocaleDateString(
                      lang === "cn" ? "zh-CN" : "en-US",
                      { month: "short", day: "numeric", year: "numeric" },
                    )}
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
