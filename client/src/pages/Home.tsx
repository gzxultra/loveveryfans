/*
 * Design: Montessori Naturalism / Scandinavian Minimalism
 * Mobile-first responsive design with CN/EN language toggle
 * Search functionality for kits and toys
 */

import { stages } from "@/data/kits";
import { standaloneProducts, productCategories, getProductSlug } from "@/data/standaloneProducts";
import { getAccessibleTextColor } from "@/lib/imageUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useI18n } from "@/hooks/useI18n";
import LanguageToggle from "@/components/LanguageToggle";
import Footer from "@/components/Footer";
import { ArrowRight, BookOpen, Baby, Sparkles, Menu, X, Search, Music, Droplets, Box, Star, Scale } from "lucide-react";
import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { useFuzzySearch } from "@/hooks/useFuzzySearch";
import HighlightedText from "@/components/HighlightedText";
import HeroSection from "@/components/HeroSection";
import StageSection from "@/components/StageSection";
import { Link, useLocation } from "wouter";

// Prefetch KitDetail chunk on hover for faster navigation
let kitDetailPrefetched = false;
function prefetchKitDetail() {
  if (!kitDetailPrefetched) {
    kitDetailPrefetched = true;
    import("./KitDetail");
  }
}
import { applyHomePageSeo } from "@/lib/seoHelpers";

// Lazy load below-the-fold components
const FeedbackForm = lazy(() => import("@/components/FeedbackForm"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSectionWrapper"));
const FAQSection = lazy(() => import("@/components/FAQSectionWrapper"));
const StatsCounter = lazy(() => import("@/components/StatsCounterWrapper"));
const AgePickerNav = lazy(() => import("@/components/AgePickerNavWrapper"));
const BackToTop = lazy(() => import("@/components/BackToTopWrapper"));
const EmailSubscription = lazy(() => import("@/components/EmailSubscription"));
const AgeMatcherTool = lazy(() => import("@/components/AgeMatcherTool"));
const ValueProposition = lazy(() => import("@/components/ValueProposition"));

let productDetailPrefetched = false;
function prefetchProductDetail() {
  if (!productDetailPrefetched) {
    productDetailPrefetched = true;
    import("./ProductDetail");
  }
}

function scrollToStage(stageId: string) {
  const el = document.getElementById(`stage-${stageId}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function scrollToProducts() {
  const el = document.getElementById("standalone-products");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function getProductCategoryIcon(iconName: string) {
  switch (iconName) {
    case "music": return Music;
    case "bath": return Droplets;
    case "blocks": return Box;
    case "gym": return Baby;
    default: return BookOpen;
  }
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { lang, t } = useLanguage();
  const i18n = useI18n();
  const [, setLocation] = useLocation();

  const stageLabel = (id: string) => {
    const key = id as keyof typeof i18n.stages;
    return i18n.stages[key]?.[lang] ?? id;
  };
  const stageRange = (id: string) => {
    const key = id as keyof typeof i18n.stageRanges;
    return i18n.stageRanges[key]?.[lang] ?? "";
  };

  // Search results — powered by useFuzzySearch (synonym + token matching)
  const searchResults = useFuzzySearch(searchQuery);

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    applyHomePageSeo();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/70 shadow-sm shadow-foreground/3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/">
              <span data-logo-target className="font-display text-xl sm:text-2xl text-foreground tracking-tight font-bold select-none hover:opacity-80 transition-opacity">
                Lovevery
              </span>
            </Link>
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
              {stages.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollToStage(s.id)}
                  className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:rounded-full after:transition-all hover:after:w-full"
                >
                  {stageLabel(s.id)}
                </button>
              ))}

              <button
                onClick={scrollToProducts}
                className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:rounded-full after:transition-all hover:after:w-full"
              >
                {i18n.nav.products[lang]}
              </button>
              <Link href="/about/">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {i18n.nav.aboutUs[lang]}
                </span>
              </Link>
              <Link href="/compare/">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5" />
                  {t("对比", "Compare")}
                </span>
              </Link>

              {/* Search bar - Desktop */}
              <div ref={searchContainerRef} className="relative">
                <div className="flex items-center bg-accent rounded-full px-3 py-1.5 gap-2 focus-within:ring-2 focus-within:ring-primary/40 transition-all">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchOpen(true);
                    }}
                    onFocus={() => setSearchOpen(true)}
                    placeholder={i18n.search.placeholder[lang]}
                    className="bg-transparent text-sm text-foreground placeholder-[#9B8E7E] outline-none w-40 lg:w-52"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSearchOpen(false);
                      }}
                      className="text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {searchOpen && searchQuery.trim() && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl border border-border shadow-xl shadow-foreground/10 overflow-hidden max-h-[70vh] overflow-y-auto">
                    {searchResults.length > 0 ? (
                      <>
                        <div className="px-4 py-2.5 border-b border-accent text-xs text-muted-foreground">
                          {searchResults.length} {i18n.search.resultCount[lang]}
                        </div>
                        {searchResults.map((result, idx) => (
                          <button
                            key={`${result.kitId}-${result.toyEnglishName || "kit"}-${idx}`}
                            onClick={() => {
                              setLocation(result.isProduct ? `/product/${getProductSlug(result.kitId)}/` : `/kit/${result.kitId}/`);
                              setSearchQuery("");
                              setSearchOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-background transition-colors border-b border-accent last:border-b-0 min-h-[48px]"
                          >
                            {result.matchType === "kit" ? (
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: result.kitColor + "15" }}
                                >
                                  <BookOpen className="w-4 h-4" style={{ color: result.kitColor }} />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground"><HighlightedText text={result.kitName} query={searchQuery} /></p>
                                  <p className="text-xs text-muted-foreground">Play Kit</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: result.kitColor + "10" }}
                                >
                                  <Sparkles className="w-4 h-4" style={{ color: result.kitColor }} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    <HighlightedText text={lang === "cn" ? t(result.toyName!, result.toyEnglishName!) : (result.toyEnglishName || "")} query={searchQuery} />
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {lang === "cn" ? result.toyEnglishName : t(result.toyName!, result.toyEnglishName!)} · {result.kitName}
                                  </p>
                                </div>
                              </div>
                            )}
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        {i18n.search.noResults[lang]}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <LanguageToggle />
            </div>
            {/* Mobile: search + language toggle + hamburger */}
            <div className="flex md:hidden items-center gap-1">
              <button
                className="p-2 text-muted-foreground hover:text-foreground min-w-[48px] min-h-[48px] flex items-center justify-center"
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  setMobileMenuOpen(false);
                }}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <LanguageToggle />
              <button
                className="p-2 text-muted-foreground hover:text-foreground min-w-[48px] min-h-[48px] flex items-center justify-center"
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  setSearchOpen(false);
                }}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="md:hidden bg-background border-t border-border px-4 py-3">
            <div className="flex items-center bg-accent rounded-full px-3 py-2 gap-2 focus-within:ring-2 focus-within:ring-primary/40">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={i18n.search.placeholder[lang]}
                className="bg-transparent text-sm text-foreground placeholder-[#9B8E7E] outline-none flex-1"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile search results */}
            {searchQuery.trim() && (
              <div className="mt-2 bg-white rounded-xl border border-border shadow-lg overflow-hidden max-h-[60vh] overflow-y-auto">
                {searchResults.length > 0 ? (
                  <>
                    <div className="px-4 py-2 border-b border-accent text-xs text-muted-foreground">
                      {searchResults.length} {i18n.search.resultCount[lang]}
                    </div>
                    {searchResults.map((result, idx) => (
                      <button
                        key={`m-${result.kitId}-${result.toyEnglishName || "kit"}-${idx}`}
                        onClick={() => {
                          setLocation(result.isProduct ? `/product/${getProductSlug(result.kitId)}/` : `/kit/${result.kitId}/`);
                          setSearchQuery("");
                          setSearchOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-background transition-colors border-b border-accent last:border-b-0 min-h-[48px]"
                      >
                        {result.matchType === "kit" ? (
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: result.kitColor + "15" }}
                            >
                              <BookOpen className="w-4 h-4" style={{ color: result.kitColor }} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground"><HighlightedText text={result.kitName} query={searchQuery} /></p>
                              <p className="text-xs text-muted-foreground">Play Kit</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: result.kitColor + "10" }}
                            >
                              <Sparkles className="w-4 h-4" style={{ color: result.kitColor }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {lang === "cn" ? t(result.toyName!, result.toyEnglishName!) : result.toyEnglishName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {lang === "cn" ? result.toyEnglishName : t(result.toyName!, result.toyEnglishName!)} · {result.kitName}
                              </p>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    {i18n.search.noResults[lang]}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border shadow-lg">
            <div className="px-4 py-3 space-y-1">
              {stages.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    scrollToStage(s.id);
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-border/40 transition-colors min-h-[48px]"
                >
                  <span className="flex items-center justify-between">
                    {stageLabel(s.id)}
                    <span className="text-xs text-muted-foreground">{stageRange(s.id)}</span>
                  </span>
                </button>
              ))}
              <button
                onClick={() => {
                  scrollToProducts();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-border/40 transition-colors min-h-[48px]"
              >
                <span className="flex items-center justify-between">
                  {i18n.nav.products[lang]}
                  <span className="text-xs text-muted-foreground">{t(`${standaloneProducts.length} 款产品`, `${standaloneProducts.length} Products`)}</span>
                </span>
              </button>
              <Link href="/about/">
                <span
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-border/40 transition-colors min-h-[48px] flex items-center"
                >
                  {i18n.nav.aboutUs[lang]}
                </span>
              </Link>
              <Link href="/compare/">
                <span
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-border/40 transition-colors min-h-[48px] flex items-center gap-2"
                >
                  <Scale className="w-4 h-4" />
                  {t("Kit 对比", "Compare Kits")}
                </span>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <HeroSection onExplore={() => scrollToStage("baby")} />

      {/* Age Matcher Tool — find the right Kit by birth date or age */}
      <Suspense fallback={<div className="py-8 sm:py-12" />}>
        <AgeMatcherTool />
      </Suspense>

      {/* Value Proposition — highlight core differentiators */}
      <Suspense fallback={<div className="py-8 sm:py-12" />}>
        <ValueProposition />
      </Suspense>

      {/* Stats Counter Section */}
      <section className="py-8 sm:py-12 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="h-32" />}>
            <StatsCounter />
          </Suspense>
        </div>
      </section>

      {/* Age Picker Navigation */}
      <section className="py-6 sm:py-8 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="h-24" />}>
            <AgePickerNav />
          </Suspense>
        </div>
      </section>

      {/* Testimonials Section - lazy loaded */}
      <Suspense fallback={<div className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-secondary via-background to-secondary" />}>
        <TestimonialsSection />
      </Suspense>

      {/* Stage Sections */}
      {stages.map((stage) => (
        <StageSection key={stage.id} stage={stage} onPrefetchKitDetail={prefetchKitDetail} />
      ))}

      {/* Standalone Products Section */}
      <section id="standalone-products" className="py-10 sm:py-16 md:py-24 scroll-mt-16 sm:scroll-mt-20 bg-gradient-to-br from-secondary via-background to-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8">
              <div className="shrink-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 border bg-primary/10 text-primary border-primary/25">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t(`${standaloneProducts.length} 款独立产品`, `${standaloneProducts.length} Standalone Products`)}
                </div>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-foreground tracking-tight">
                  {i18n.products.sectionTitle[lang]}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {i18n.products.sectionSubtitle[lang]}
                </p>
              </div>
              <div className="hidden sm:block flex-1 h-px bg-gradient-to-r from-border via-border/50 to-transparent" />
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {standaloneProducts.map((product) => {
              const catInfo = productCategories.find((c) => c.id === product.category);
              const CategoryIcon = getProductCategoryIcon(catInfo?.icon || "blocks");
              return (
                <Link key={product.id} href={`/product/${getProductSlug(product.id)}/`}>
                  <div
                    className="group relative rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-border hover:border-border hover:shadow-2xl hover:shadow-foreground/12 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer h-full active:scale-[0.98] card-glow"
                    onMouseEnter={prefetchProductDetail}
                    onTouchStart={prefetchProductDetail}
                  >
                    {/* Color accent bar */}
                    <div
                      className="h-1 sm:h-1.5 w-full"
                      style={{ background: `linear-gradient(90deg, ${product.color}, ${product.color}88)` }}
                    />
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-lg sm:text-xl text-foreground mb-1 truncate group-hover:text-foreground transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {lang === "cn" ? t(product.ageRange, product.ageRangeEn || product.ageRange) : (product.ageRangeEn || product.ageRange)}
                          </p>
                        </div>
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: product.color + "15" }}
                        >
                          <CategoryIcon className="w-5 h-5" style={{ color: product.color }} />
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4">
                        {lang === "cn" ? t(product.description, product.descriptionEn || product.description) : (product.descriptionEn || product.description)}
                      </p>

                      <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-accent group-hover:border-border transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-0.5 text-xs text-amber-600">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {product.rating}
                          </span>
                        </div>
                        <span
                          className="text-xs sm:text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all min-h-[48px] min-w-[48px] justify-end"
                          style={{ color: getAccessibleTextColor(product.color) }}
                        >
                          {i18n.products.viewProduct[lang]}
                          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section - lazy loaded */}
      <Suspense fallback={<div className="py-12" />}>
        <FAQSection />
      </Suspense>

      {/* Feedback Form - lazy loaded */}
      <Suspense fallback={<div className="py-12 sm:py-20" />}>
        <FeedbackForm />
      </Suspense>

      {/* Email Subscription — above footer */}
      <Suspense fallback={<div className="py-12 sm:py-16" />}>
        <EmailSubscription />
      </Suspense>

      {/* Back to Top button */}
      <Suspense fallback={null}>
        <BackToTop />
      </Suspense>

      {/* Footer */}
      <Footer onStageClick={scrollToStage} />
    </div>
  );
}
