import { Link, useParams } from "wouter";
import { ArrowLeft, Clock, Calendar, Tag, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getBlogPost, blogPosts } from "@/data/blogPosts";
import LanguageToggle from "@/components/LanguageToggle";
import { useEffect } from "react";
import NotFound from "./NotFound";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLanguage();
  const post = getBlogPost(slug || "");

  useEffect(() => {
    if (!post) return;
    document.title = `${lang === "cn" ? post.title : post.titleEn} | Lovevery Fans`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", lang === "cn" ? post.excerpt : post.excerptEn);
    }
    // Structured data for blog post
    const existingScript = document.querySelector('script[data-blog-schema]');
    if (existingScript) existingScript.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-blog-schema", "true");
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": lang === "cn" ? post.title : post.titleEn,
      "description": lang === "cn" ? post.excerpt : post.excerptEn,
      "author": { "@type": "Person", "name": post.author },
      "datePublished": post.date,
      "publisher": {
        "@type": "Organization",
        "name": "Lovevery Fans",
        "url": "https://loveveryfans.com"
      },
      "url": `https://loveveryfans.com/blog/${post.slug}/`,
    });
    document.head.appendChild(script);
    return () => {
      const s = document.querySelector('script[data-blog-schema]');
      if (s) s.remove();
    };
  }, [post, lang]);

  if (!post) return <NotFound />;

  // Get adjacent posts for navigation
  const currentIndex = blogPosts.findIndex((p) => p.slug === post.slug);
  const prevPost = currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? blogPosts[currentIndex - 1] : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/70">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          <Link href="/blog/">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              {t("博客", "Blog")}
            </span>
          </Link>
          <LanguageToggle />
        </div>
      </nav>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Header */}
        <header className="mb-8 sm:mb-12">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(lang === "cn" ? post.tags : post.tagsEn).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-foreground mb-4 leading-tight tracking-tight">
            {lang === "cn" ? post.title : post.titleEn}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-6 border-b border-border">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(post.date).toLocaleDateString(
                lang === "cn" ? "zh-CN" : "en-US",
                { year: "numeric", month: "long", day: "numeric" }
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {post.readingTime} {t("分钟阅读", "min read")}
            </span>
            <span className="text-[#9A8E82]">{post.author}</span>
          </div>

          {/* Excerpt */}
          <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed italic border-l-4 border-primary/40 pl-4">
            {lang === "cn" ? post.excerpt : post.excerptEn}
          </p>
        </header>

        {/* Content */}
        <div
          className="prose prose-stone max-w-none
            prose-headings:font-display prose-headings:text-foreground prose-headings:tracking-tight
            prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
            prose-p:text-foreground prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground
            prose-code:text-foreground prose-code:bg-accent prose-code:px-1 prose-code:rounded
            prose-blockquote:border-primary/40 prose-blockquote:text-muted-foreground
            prose-hr:border-border
            prose-table:text-sm
            prose-th:bg-secondary prose-th:text-foreground
            prose-td:border-border
            prose-li:text-foreground"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        {/* Post Navigation */}
        <nav className="mt-12 sm:mt-16 pt-8 border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevPost && (
              <Link href={`/blog/${prevPost.slug}/`}>
                <div className="group p-4 rounded-xl border border-border hover:border-border hover:shadow-md transition-all">
                  <p className="text-xs text-[#9A8E82] mb-1 flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" />
                    {t("上一篇", "Previous")}
                  </p>
                  <p className="text-sm font-medium text-foreground group-hover:text-foreground line-clamp-2 transition-colors">
                    {lang === "cn" ? prevPost.title : prevPost.titleEn}
                  </p>
                </div>
              </Link>
            )}
            {nextPost && (
              <Link href={`/blog/${nextPost.slug}/`}>
                <div className="group p-4 rounded-xl border border-border hover:border-border hover:shadow-md transition-all sm:text-right">
                  <p className="text-xs text-[#9A8E82] mb-1 flex items-center gap-1 sm:justify-end">
                    {t("下一篇", "Next")}
                    <ArrowRight className="w-3 h-3" />
                  </p>
                  <p className="text-sm font-medium text-foreground group-hover:text-foreground line-clamp-2 transition-colors">
                    {lang === "cn" ? nextPost.title : nextPost.titleEn}
                  </p>
                </div>
              </Link>
            )}
          </div>
        </nav>

        {/* CTA */}
        <div className="mt-8 p-6 bg-gradient-to-br from-secondary to-background rounded-2xl border border-border text-center">
          <p className="text-sm text-muted-foreground mb-3">
            {t(
              "想找 Lovevery 的 Amazon 平替？查看我们的完整 Kit 指南",
              "Looking for Lovevery Amazon alternatives? Check our complete Kit guide"
            )}
          </p>
          <Link href="/">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-white rounded-full text-sm font-medium hover:bg-foreground transition-colors">
              {t("查看 Kit 指南", "View Kit Guide")}
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </article>

      {/* Footer */}
      <footer className="bg-foreground text-white py-8 mt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
