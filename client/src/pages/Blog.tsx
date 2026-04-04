import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Clock, Calendar, Tag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { blogPosts } from "@/data/blogPosts";
import LanguageToggle from "@/components/LanguageToggle";
import { useEffect } from "react";

export default function Blog() {
  const { lang, t } = useLanguage();

  useEffect(() => {
    document.title = lang === "cn"
      ? "育儿博客 | Lovevery Fans"
      : "Parenting Blog | Lovevery Fans";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        lang === "cn"
          ? "Lovevery Fans 育儿博客：深度评测、省钱攻略、宝宝发展里程碑指南"
          : "Lovevery Fans parenting blog: in-depth reviews, money-saving tips, and baby development milestone guides"
      );
    }
  }, [lang]);

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-lg border-b border-[#E8DFD3]/70">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          <Link href="/">
            <span className="inline-flex items-center gap-2 text-sm text-[#756A5C] hover:text-[#3D3229] transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-display text-base sm:text-lg text-[#3D3229]">Lovevery Fans</span>
            </span>
          </Link>
          <LanguageToggle />
        </div>
      </nav>

      {/* Header */}
      <header className="py-12 sm:py-16 bg-gradient-to-b from-[#F5F0EB] to-[#FAF7F2]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-4 border bg-[#7FB685]/10 text-[#4a8a54] border-[#7FB685]/25">
            <Tag className="w-3.5 h-3.5" />
            {t("育儿指南", "Parenting Guide")}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-[#1a1108] mb-4 tracking-tight">
            {t("育儿博客", "Parenting Blog")}
          </h1>
          <p className="text-base sm:text-lg text-[#5A4E42] max-w-2xl mx-auto leading-relaxed">
            {t(
              "深度评测、省钱攻略、宝宝发展里程碑——帮助你做出更明智的育儿决策",
              "In-depth reviews, money-saving tips, and baby development guides to help you make smarter parenting decisions"
            )}
          </p>
        </div>
      </header>

      {/* Blog Posts Grid */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}/`}>
              <article className="group bg-white rounded-2xl border border-[#E8DFD3] hover:border-[#C8BFB3] hover:shadow-xl hover:shadow-[#3D3229]/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-full flex flex-col">
                {/* Color accent */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#7FB685] to-[#7FB685]/40" />

                <div className="p-5 sm:p-6 flex flex-col flex-1">
                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-[#9A8E82] mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.date).toLocaleDateString(
                        lang === "cn" ? "zh-CN" : "en-US",
                        { year: "numeric", month: "long", day: "numeric" }
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readingTime} {t("分钟阅读", "min read")}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="font-display text-lg sm:text-xl text-[#1a1108] mb-2 group-hover:text-[#3D3229] transition-colors leading-snug">
                    {lang === "cn" ? post.title : post.titleEn}
                  </h2>

                  {/* Excerpt */}
                  <p className="text-sm text-[#5A4E42] leading-relaxed line-clamp-3 flex-1 mb-4">
                    {lang === "cn" ? post.excerpt : post.excerptEn}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(lang === "cn" ? post.tags : post.tagsEn).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#7FB685]/10 text-[#4a8a54] border border-[#7FB685]/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Read more */}
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-[#5a9e65] group-hover:gap-2 transition-all">
                    {t("阅读全文", "Read more")}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Back to home */}
        <div className="mt-12 sm:mt-16 text-center">
          <Link href="/">
            <span className="inline-flex items-center gap-2 px-6 py-3 bg-[#3D3229] text-white rounded-full text-sm font-medium hover:bg-[#2A231C] transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t("返回 Kit 指南", "Back to Kit Guide")}
            </span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#3D3229] text-white py-8 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-[#9A8E82]">
            {t(
              "© 2026 Lovevery Fans · 独立粉丝网站，与 Lovevery Inc. 无关",
              "© 2026 Lovevery Fans · Independent fan site, not affiliated with Lovevery Inc."
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
