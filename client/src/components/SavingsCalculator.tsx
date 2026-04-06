/**
 * SavingsCalculator — Interactive savings calculator for Kit detail pages.
 *
 * Allows users to check off Amazon alternatives they plan to buy,
 * then shows the total cost vs. the Lovevery kit price and the savings.
 *
 * Features:
 * - Checkbox per alternative product
 * - Real-time total calculation
 * - Savings amount and percentage
 * - Per-item "Buy on Amazon" links using the /dp/ASIN?tag=... format
 * - Bilingual (CN/EN)
 *
 * NOTE on Amazon cart links:
 *   The legacy /gp/aws/cart/add.html multi-item cart endpoint has been
 *   unreliable since at least 2020 and frequently returns error pages.
 *   Amazon's officially supported affiliate link format is:
 *     https://www.amazon.com/dp/{ASIN}?tag={ASSOCIATE_TAG}
 *   We therefore render individual "Buy on Amazon" buttons per selected item
 *   rather than a single multi-item cart URL.
 */

import { useState, useMemo, useCallback } from "react";
import { ShoppingCart, TrendingDown, DollarSign, Check, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Alternative } from "@/data/alternatives";
import { trackEvent } from "@/lib/analytics";

// Lovevery kit price varies; use the subscription price as reference
const LOVEVERY_KIT_PRICE_USD = 80;
const AFFILIATE_TAG = "loveveryfans-20";

interface SavingsCalculatorProps {
  alternatives: Alternative[];
  kitName: string;
  kitId: string;
  kitPrice?: number;
}

/**
 * Parse a price string like "$12.99" or "12.99" to a number.
 * Returns null if unparseable.
 */
export function parsePrice(price: string | number | null | undefined): number | null {
  if (price === null || price === undefined || price === "") return null;
  const str = String(price).replace(/[^0-9.]/g, "");
  const num = parseFloat(str);
  return isNaN(num) || num <= 0 ? null : num;
}

/**
 * Build an Amazon product page URL for a single ASIN with the affiliate tag.
 *
 * Uses the /dp/{ASIN}?tag={TAG} format which is:
 * - Officially documented by Amazon Associates
 * - Reliably supported across all regions and product types
 * - Not subject to the deprecation issues affecting /gp/aws/cart/add.html
 *
 * Format:
 *   https://www.amazon.com/dp/B0XXXXXXXXX?tag=loveveryfans-20
 */
export function buildAmazonProductUrl(asin: string): string {
  if (!asin || !asin.trim()) return "";
  return `https://www.amazon.com/dp/${encodeURIComponent(asin.trim())}?tag=${AFFILIATE_TAG}`;
}

/**
 * Build Amazon product URLs for a list of ASINs.
 * Returns an array of { asin, url } objects.
 *
 * @deprecated Use buildAmazonProductUrl per item instead of a multi-item cart URL.
 *   The /gp/aws/cart/add.html endpoint is unreliable and frequently returns error pages.
 *   This function is kept for backwards-compatibility with existing tests that may
 *   reference it, but new code should call buildAmazonProductUrl directly.
 */
export function buildAmazonCartUrl(asins: string[]): string {
  // Return the first item's product URL as the "primary" link.
  // For multi-item scenarios, the UI renders individual buttons per item.
  if (asins.length === 0) return "";
  return buildAmazonProductUrl(asins[0]);
}

export function SavingsCalculator({
  alternatives,
  kitName,
  kitId,
  kitPrice = LOVEVERY_KIT_PRICE_USD,
}: SavingsCalculatorProps) {
  const { lang, t } = useLanguage();

  // Track which alternatives are selected (by ASIN)
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Filter alternatives that have parseable prices
  const pricedAlts = useMemo(
    () =>
      alternatives.filter((alt) => parsePrice(alt.price) !== null),
    [alternatives]
  );

  const toggleAlt = useCallback((asin: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(asin)) {
        next.delete(asin);
      } else {
        next.add(asin);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(pricedAlts.map((a) => a.asin)));
  }, [pricedAlts]);

  const clearAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  // Calculate totals
  const { totalSelected, savings, savingsPct } = useMemo(() => {
    const total = pricedAlts
      .filter((a) => selected.has(a.asin))
      .reduce((sum, a) => sum + (parsePrice(a.price) ?? 0), 0);

    const sav = Math.max(0, kitPrice - total);
    const pct = kitPrice > 0 ? Math.round((sav / kitPrice) * 100) : 0;

    return { totalSelected: total, savings: sav, savingsPct: pct };
  }, [selected, pricedAlts, kitPrice]);

  // Build per-item Amazon product URLs for selected items
  const selectedItems = useMemo(() => {
    return pricedAlts
      .filter((a) => selected.has(a.asin))
      .map((a) => ({
        asin: a.asin,
        name: a.name,
        price: parsePrice(a.price),
        url: buildAmazonProductUrl(a.asin),
      }));
  }, [selected, pricedAlts]);

  if (pricedAlts.length === 0) return null;

  const selectedCount = selected.size;
  const hasSavings = savings > 0 && selectedCount > 0;

  return (
    <div className="rounded-xl border border-[#D0E4D8] bg-gradient-to-br from-[#F0F9F2] to-[#F8FDF9] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-[#7FB685]/15 to-[#5a9e65]/10 border-b border-[#D0E4D8]">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-[#5a9e65]" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-[#2D5A35]">
            {t("省钱计算器", "Savings Calculator")}
          </h3>
        </div>
        <p className="text-xs text-[#4A7A52] mt-0.5">
          {t(
            `勾选你想买的平替，看看能省多少钱（对比 Lovevery ${kitName} $${kitPrice}）`,
            `Check the alternatives you want to buy and see how much you save vs. Lovevery ${kitName} ($${kitPrice})`
          )}
        </p>
      </div>

      {/* Product checklist */}
      <div className="p-3 sm:p-4 space-y-2">
        {/* Select all / clear */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={selectAll}
            className="text-xs text-[#5a9e65] hover:text-[#2D5A35] font-medium transition-colors"
          >
            {t("全选", "Select All")}
          </button>
          <span className="text-[#D0E4D8]">|</span>
          <button
            onClick={clearAll}
            className="text-xs text-[#756A5C] hover:text-[#3D3229] font-medium transition-colors"
          >
            {t("清空", "Clear")}
          </button>
          {selectedCount > 0 && (
            <span className="ml-auto text-xs text-[#5a9e65] font-medium">
              {t(`已选 ${selectedCount} 件`, `${selectedCount} selected`)}
            </span>
          )}
        </div>

        {pricedAlts.map((alt) => {
          const price = parsePrice(alt.price);
          const isChecked = selected.has(alt.asin);

          return (
            <label
              key={alt.asin}
              className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                isChecked
                  ? "bg-[#E8F5EC] border border-[#A8D5B0]"
                  : "bg-white border border-[#E8DFD3] hover:border-[#A8D5B0]"
              }`}
            >
              {/* Checkbox */}
              <div
                className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                  isChecked ? "bg-[#5a9e65]" : "bg-white border-2 border-[#C8BFB3]"
                }`}
                aria-hidden="true"
              >
                {isChecked && <Check className="w-3 h-3 text-white" />}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={isChecked}
                onChange={() => toggleAlt(alt.asin)}
                aria-label={`Select ${alt.name} — $${price?.toFixed(2)}`}
              />

              {/* Product name */}
              <span className="flex-1 text-xs text-[#3D3229] line-clamp-2 leading-snug">
                {alt.name}
              </span>

              {/* Price */}
              <span
                className={`text-sm font-bold whitespace-nowrap ${
                  isChecked ? "text-[#5a9e65]" : "text-[#D4A574]"
                }`}
              >
                ${price?.toFixed(2)}
              </span>
            </label>
          );
        })}
      </div>

      {/* Summary */}
      {selectedCount > 0 && (
        <div className="px-4 py-3 bg-white border-t border-[#D0E4D8]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[#756A5C]" aria-hidden="true" />
              <span className="text-xs text-[#756A5C]">
                {t("平替总价", "Alternatives Total")}
              </span>
            </div>
            <span className="text-base font-bold text-[#3D3229]">
              ${totalSelected.toFixed(2)}
            </span>
          </div>

          {hasSavings && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-[#5a9e65]" aria-hidden="true" />
                <span className="text-xs text-[#5a9e65] font-medium">
                  {t("预计节省", "You Save")}
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-[#5a9e65]">
                  ${savings.toFixed(2)}
                </span>
                <span className="text-xs text-[#5a9e65] ml-1">
                  ({savingsPct}%)
                </span>
              </div>
            </div>
          )}

          {/* Per-item Amazon buy buttons */}
          <div className="space-y-2">
            <p className="text-xs text-[#756A5C] font-medium mb-1.5">
              {t("在 Amazon 购买选中商品：", "Buy selected items on Amazon:")}
            </p>
            {selectedItems.map((item) => (
              <a
                key={item.asin}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={() => {
                  trackEvent("one_click_cart", {
                    kit_id: kitId,
                    kit_name: kitName,
                    asin: item.asin,
                    item_name: item.name,
                    item_price: item.price?.toFixed(2),
                    total_price: totalSelected.toFixed(2),
                    savings: savings.toFixed(2),
                    item_count: selectedCount,
                  });
                }}
                className="flex items-center justify-between gap-2 w-full px-3 py-2 rounded-lg bg-[#FF9900] hover:bg-[#E88B00] text-white text-xs font-semibold transition-all duration-200 hover:shadow-md hover:shadow-[#FF9900]/20 active:scale-[0.98]"
                aria-label={`Buy ${item.name} on Amazon for $${item.price?.toFixed(2)}`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <ShoppingCart className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span>${item.price?.toFixed(2)}</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
