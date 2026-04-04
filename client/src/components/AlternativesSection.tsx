import { ShoppingCart, Star, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Alternative } from "@/data/alternatives";
import { useState, useEffect, useId } from "react";
import { trackEvent } from "@/lib/analytics";
import { injectProductSchemas, removeProductSchemas } from "@/lib/productSchema";

interface AlternativesSectionProps {
  alternatives: Alternative[];
  toyName: string;
  toyNameCn: string;
  kitName?: string;
}

const AFFILIATE_TAG = "loveveryfans-20";

function ensureAffiliateTag(url: string): string {
  if (!url) return "";
  if (url.includes(`tag=${AFFILIATE_TAG}`)) return url;
  // Remove any existing tag parameter
  const cleanUrl = url.replace(/[?&]tag=[^&]*/g, "");
  const separator = cleanUrl.includes("?") ? "&" : "?";
  return `${cleanUrl}${separator}tag=${AFFILIATE_TAG}`;
}

function renderStars(rating: number | null) {
  if (rating == null) return [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const stars = [];

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <Star
          key={i}
          className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#FFB81C] text-[#FFB81C]"
          aria-hidden="true"
        />
      );
    } else if (i === fullStars && hasHalf) {
      stars.push(
        <div key={i} className="relative w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true">
          <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#E8DFD3]" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#FFB81C] text-[#FFB81C]" />
          </div>
        </div>
      );
    } else {
      stars.push(
        <Star key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#E8DFD3]" aria-hidden="true" />
      );
    }
  }

  return stars;
}

function formatPrice(price: string | null | number, lang: string, convert: (s: string) => string): string {
  if (price === null || price === undefined || price === "") return lang === "cn" ? convert("查看价格") : "Check Price";
  return String(price).replace(/\.$/, "");
}

/**
 * Build a descriptive, SEO-friendly alt text for a product image.
 * Format: "{productName} — affordable alternative to Lovevery {toyName} for {kitName}"
 */
function buildImageAlt(altProduct: Alternative, toyName: string, kitName?: string): string {
  const parts = [altProduct.name];
  if (toyName) parts.push(`affordable alternative to Lovevery ${toyName}`);
  if (kitName) parts.push(`for ${kitName}`);
  return parts.join(" — ");
}

export function AlternativesSection({
  alternatives,
  toyName,
  toyNameCn,
  kitName,
}: AlternativesSectionProps) {
  const { lang, t, convert } = useLanguage();
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  // Unique ID for this section instance (used to scope Product Schema injection)
  const schemaContainerId = useId();

  // Inject Product Schema structured data for SEO
  useEffect(() => {
    if (!alternatives || alternatives.length === 0) return;
    injectProductSchemas(alternatives, toyName, schemaContainerId);
    return () => {
      removeProductSchemas(schemaContainerId);
    };
  }, [alternatives, toyName, schemaContainerId]);

  if (!alternatives || alternatives.length === 0) {
    return null;
  }

  const handleImageError = (idx: number) => {
    setImageErrors(prev => new Set(prev).add(idx));
  };

  return (
    <div className="rounded-lg sm:rounded-xl border border-[#D0E4F0] overflow-hidden">
      {/* Section Header */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-[#E8F4F8] to-[#F0E8F8] border-b border-[#D0E4F0]">
        <p className="text-[10px] sm:text-xs font-semibold text-[#5B7B99] uppercase tracking-wider flex items-center gap-1.5">
          <ShoppingCart className="w-3.5 h-3.5 text-[#5B7B99]" aria-hidden="true" />
          {t(`💡 Amazon 高性价比平替 (${alternatives.length})`, `💡 Affordable Alternatives (${alternatives.length})`)}
        </p>
      </div>

      {/* Alternative Cards */}
      <div className="divide-y divide-[#E8F0F4]">
        {alternatives.map((alt, idx) => (
          <div
            key={alt.asin || idx}
            className="p-3 sm:p-4 bg-gradient-to-br from-[#FAFCFD] to-[#F8F5FC] hover:from-[#F0F6FA] hover:to-[#F0EBFA] transition-colors"
            itemScope
            itemType="https://schema.org/Product"
          >
            <div className="flex gap-3 sm:gap-4">
              {/* Product Image */}
              {alt.imageUrl && !imageErrors.has(idx) ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-white border border-[#E8DFD3] flex items-center justify-center p-1.5">
                  <img
                    src={alt.imageUrl}
                    alt={buildImageAlt(alt, toyName, kitName)}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    width={80}
                    height={80}
                    onError={() => handleImageError(idx)}
                    itemProp="image"
                  />
                </div>
              ) : (
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg bg-gradient-to-br from-[#FAF7F2] to-[#F0EBE3] border border-[#E8DFD3] flex items-center justify-center"
                  role="img"
                  aria-label={`${alt.name} product image placeholder`}
                >
                  <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-[#C8BFB3]" aria-hidden="true" />
                </div>
              )}

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                {/* Top row: Name + Price */}
                <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                  <h4
                    className="font-display text-xs sm:text-sm font-semibold text-[#3D3229] line-clamp-2 flex-1"
                    itemProp="name"
                  >
                    {alt.name}
                  </h4>
                  <span
                    className="text-sm sm:text-base font-bold text-[#D4A574] whitespace-nowrap"
                    itemProp="offers"
                    itemScope
                    itemType="https://schema.org/Offer"
                  >
                    <meta itemProp="priceCurrency" content="USD" />
                    {alt.price && (
                      <meta
                        itemProp="price"
                        content={String(alt.price).replace(/[^0-9.]/g, "")}
                      />
                    )}
                    {formatPrice(alt.price, lang, convert)}
                  </span>
                </div>

                {/* Rating row */}
                {alt.rating != null && alt.rating > 0 && (
                  <div
                    className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap"
                    itemProp="aggregateRating"
                    itemScope
                    itemType="https://schema.org/AggregateRating"
                  >
                    <meta itemProp="ratingValue" content={String(alt.rating)} />
                    {alt.reviewCount != null && (
                      <meta itemProp="reviewCount" content={String(alt.reviewCount)} />
                    )}
                    <meta itemProp="bestRating" content="5" />
                    <div className="flex items-center gap-1">
                      <div
                        className="flex gap-0.5"
                        aria-label={`Rating: ${alt.rating.toFixed(1)} out of 5 stars`}
                      >
                        {renderStars(alt.rating)}
                      </div>
                      <span className="text-[11px] sm:text-xs font-medium text-[#3D3229]">
                        {alt.rating.toFixed(1)}
                      </span>
                    </div>
                    {alt.reviewCount != null && alt.reviewCount > 0 && (
                      <span className="text-[10px] sm:text-xs text-[#756A5C]">
                        ({alt.reviewCount.toLocaleString()}{" "}
                        {t("条评价", "reviews")})
                      </span>
                    )}
                  </div>
                )}

                {/* Reason */}
                <p
                  className="text-[11px] sm:text-xs text-[#6B5E50] leading-relaxed mb-2.5"
                  itemProp="description"
                >
                  {lang === "cn" ? convert(alt.reasonCn) : alt.reasonEn}
                </p>

                {/* Buy Button */}
                <a
                  href={ensureAffiliateTag(alt.amazonUrl)}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  aria-label={`Buy ${alt.name} on Amazon${alt.price ? ` for ${formatPrice(alt.price, "en", (s) => s)}` : ""}`}
                  onClick={() => {
                    trackEvent("click_amazon_link", {
                      product_name: alt.name,
                      asin: alt.asin,
                      price: alt.price || "N/A",
                      kit_name: kitName || "Unknown",
                      toy_name: toyName,
                      page_url: typeof window !== "undefined" ? window.location.href : "",
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-[#FF9900] hover:bg-[#E88B00] text-white text-[11px] sm:text-xs font-medium transition-all duration-200 hover:shadow-md hover:shadow-[#FF9900]/20 active:scale-[0.98] min-h-[36px]"
                >
                  {t("去 Amazon 购买", "Buy on Amazon")}
                  <ExternalLink className="w-3 h-3 opacity-80" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Price Disclaimer */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[#F8FAFB] border-t border-[#E8F0F4]">
        <p className="text-[10px] sm:text-xs text-[#756A5C] flex items-center gap-1.5">
          <span aria-hidden="true">💡</span>
          {t("价格仅供参考，以 Amazon 实际价格为准", "Prices are approximate. Check Amazon for current pricing.")}
        </p>
      </div>
    </div>
  );
}
