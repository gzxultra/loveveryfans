/*
 * ArticleSubmissionForm – Inline form for users to submit article recommendations.
 * Designed to match the Montessori Naturalism / Scandinavian Minimalism aesthetic.
 * Supports CN/EN bilingual UI with smooth framer-motion animations.
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Send, CheckCircle, Link2, FileText, MessageSquare, User, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackEvent } from "@/lib/analytics";

const SUBMISSIONS_API_URL = import.meta.env.VITE_SUBSCRIBE_API_URL || "";

const i18n = {
  buttonLabel: { cn: "推荐一篇文章", en: "Share an Article" },
  formTitle: { cn: "推荐好文", en: "Recommend an Article" },
  formSubtitle: {
    cn: "发现了和这套 Play Kit 相关的好文章？分享给社区吧！",
    en: "Found a great article related to this Play Kit? Share it with the community!",
  },
  urlLabel: { cn: "文章链接", en: "Article URL" },
  urlPlaceholder: { cn: "https://example.com/article", en: "https://example.com/article" },
  titleLabel: { cn: "文章标题（可选）", en: "Article Title (optional)" },
  titlePlaceholder: { cn: "填写标题，或留空自动获取", en: "Enter title, or leave blank to auto-fetch" },
  descLabel: { cn: "推荐理由（可选）", en: "Why you recommend it (optional)" },
  descPlaceholder: { cn: "简单说说为什么推荐这篇文章…", en: "Briefly share why you recommend this article…" },
  authorLabel: { cn: "你的名字（可选）", en: "Your Name (optional)" },
  authorPlaceholder: { cn: "匿名也没关系", en: "Anonymous is fine" },
  submitBtn: { cn: "提交推荐", en: "Submit" },
  submitting: { cn: "提交中…", en: "Submitting…" },
  successTitle: { cn: "感谢推荐！🎉", en: "Thanks for sharing! 🎉" },
  successMsg: {
    cn: "你推荐的文章将在审核通过后展示给其他家长。",
    en: "Your recommendation will be displayed after review.",
  },
  submitAnother: { cn: "再推荐一篇", en: "Submit Another" },
  cancel: { cn: "取消", en: "Cancel" },
  urlRequired: { cn: "请输入文章链接", en: "Please enter the article URL" },
  urlInvalid: { cn: "请输入有效的网址", en: "Please enter a valid URL" },
  errorGeneric: { cn: "提交失败，请稍后重试", en: "Submission failed. Please try again later." },
} as const;

interface Props {
  kitId: string;
  kitColor: string;
}

export function ArticleSubmissionForm({ kitId, kitColor }: Props) {
  const { lang, convert } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [authorName, setAuthorName] = useState("");

  const t = useCallback(
    (key: keyof typeof i18n) => (lang === "cn" ? convert(i18n[key].cn) : i18n[key].en),
    [lang, convert],
  );

  const resetForm = () => {
    setUrl("");
    setTitle("");
    setDescription("");
    setAuthorName("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate URL
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError(t("urlRequired"));
      return;
    }
    try {
      new URL(trimmedUrl);
    } catch {
      setError(t("urlInvalid"));
      return;
    }

    setIsSubmitting(true);

    try {
      if (SUBMISSIONS_API_URL) {
        const res = await fetch(`${SUBMISSIONS_API_URL}/api/submissions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kit_id: kitId,
            url: trimmedUrl,
            title: title.trim() || undefined,
            description: description.trim() || undefined,
            author_name: authorName.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as any).error || "Request failed");
        }
      } else {
        // Mock submission when no API URL configured
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      trackEvent("submit_article_recommendation", {
        kit_id: kitId,
        has_title: !!title.trim(),
        has_description: !!description.trim(),
        has_author: !!authorName.trim(),
      });

      setIsSuccess(true);
      resetForm();
    } catch (err: any) {
      setError(t("errorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsSuccess(false);
    resetForm();
  };

  const handleSubmitAnother = () => {
    setIsSuccess(false);
    resetForm();
  };

  return (
    <div className="mt-6 sm:mt-8">
      {/* Trigger button */}
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.button
            key="trigger"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-xl border-2 border-dashed hover:shadow-md transition-all duration-300 active:scale-[0.98] min-h-[48px] group"
            style={{
              borderColor: kitColor + "40",
              backgroundColor: kitColor + "08",
            }}
          >
            <Plus
              className="w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform group-hover:rotate-90 duration-300"
              style={{ color: kitColor }}
            />
            <span
              className="text-sm sm:text-base font-medium"
              style={{ color: kitColor }}
            >
              {t("buttonLabel")}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Inline form */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-[#E8DFD3] bg-white shadow-sm overflow-hidden">
              {/* Header */}
              <div
                className="px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between"
                style={{ backgroundColor: kitColor + "0A" }}
              >
                <div>
                  <h3
                    className="text-base sm:text-lg font-semibold"
                    style={{ color: kitColor }}
                  >
                    {t("formTitle")}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#9B8E7E] mt-0.5">
                    {t("formSubtitle")}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-[#F5F0E8] transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4.5 h-4.5 text-[#9B8E7E]" />
                </button>
              </div>

              {/* Success state */}
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="px-4 sm:px-6 py-8 sm:py-10 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    >
                      <CheckCircle
                        className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3"
                        style={{ color: kitColor }}
                      />
                    </motion.div>
                    <h4 className="text-lg sm:text-xl font-semibold text-[#3D3229] mb-2">
                      {t("successTitle")}
                    </h4>
                    <p className="text-sm text-[#6B5E50] mb-6 max-w-sm mx-auto">
                      {t("successMsg")}
                    </p>
                    <button
                      onClick={handleSubmitAnother}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.97]"
                      style={{ backgroundColor: kitColor }}
                    >
                      {t("submitAnother")}
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form-fields"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmit}
                    className="px-4 sm:px-6 py-4 sm:py-5 space-y-4"
                  >
                    {/* URL field (required) */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-[#3D3229] mb-1.5">
                        <Link2 className="w-3.5 h-3.5" style={{ color: kitColor }} />
                        {t("urlLabel")} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder={t("urlPlaceholder")}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD3] bg-[#FAF7F2] text-sm text-[#3D3229] placeholder:text-[#C8BFB3] focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        style={{ "--tw-ring-color": kitColor + "40" } as React.CSSProperties}
                        required
                      />
                    </div>

                    {/* Title field (optional) */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-[#3D3229] mb-1.5">
                        <FileText className="w-3.5 h-3.5" style={{ color: kitColor }} />
                        {t("titleLabel")}
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t("titlePlaceholder")}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD3] bg-[#FAF7F2] text-sm text-[#3D3229] placeholder:text-[#C8BFB3] focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        style={{ "--tw-ring-color": kitColor + "40" } as React.CSSProperties}
                      />
                    </div>

                    {/* Description field (optional) */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-[#3D3229] mb-1.5">
                        <MessageSquare className="w-3.5 h-3.5" style={{ color: kitColor }} />
                        {t("descLabel")}
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t("descPlaceholder")}
                        rows={2}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD3] bg-[#FAF7F2] text-sm text-[#3D3229] placeholder:text-[#C8BFB3] focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none"
                        style={{ "--tw-ring-color": kitColor + "40" } as React.CSSProperties}
                      />
                    </div>

                    {/* Author name field (optional) */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-[#3D3229] mb-1.5">
                        <User className="w-3.5 h-3.5" style={{ color: kitColor }} />
                        {t("authorLabel")}
                      </label>
                      <input
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        placeholder={t("authorPlaceholder")}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD3] bg-[#FAF7F2] text-sm text-[#3D3229] placeholder:text-[#C8BFB3] focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        style={{ "--tw-ring-color": kitColor + "40" } as React.CSSProperties}
                      />
                    </div>

                    {/* Error message */}
                    <AnimatePresence>
                      {error && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-sm text-red-500 font-medium"
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
                        style={{ backgroundColor: kitColor }}
                      >
                        {isSubmitting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                            {t("submitting")}
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            {t("submitBtn")}
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium text-[#6B5E50] bg-[#F5F0E8] hover:bg-[#EDE7DB] transition-all active:scale-[0.97] min-h-[44px]"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
