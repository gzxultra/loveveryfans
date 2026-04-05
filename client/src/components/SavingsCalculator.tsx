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
 * - One-click Amazon Cart links (multi-item cart URL)
 * - Bilingual (CN/EN)
 */

import { useState, useMemo, useCallback } from "react";
import { ShoppingCart, TrendingDown, DollarSign, Check } from "lucide-react";
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
 * Build an Amazon multi-item cart URL from a list of ASINs.
 *
 * The /gp/aws/cart/add.html endpoint requires the affiliate tag to be passed
 * as `AssociateTag` (the Product Advertising API parameter name), NOT as `tag`
 * (which is only valid for standard product-page links). Using `tag` alone
 * causes the cart page to fail or ignore the affiliate attribution.
 *
 * We include both `AssociateTag` (required by the cart endpoint) and `tag`
 * (recognised by Amazon's general tracking layer) for maximum compatibility.
 *
 * Format:
 *   https://www.amazon.com/gp/aws/cart/add.html
 *     ?AssociateTag=XXX&tag=XXX
 *     &ASIN.1=YYY&Quantity.1=1
 *     &ASIN.2=ZZZ&Quantity.2=1
 *     ...
 */
export function buildAmazonCartUrl(asins: string[]): string {
  if (asins.length === 0) return "";
  const itemParams = asins
    .slice(0, 10) // Amazon cart supports up to 10 items
    .map((asin, i) => `ASIN.${i + 1}=${encodeURIComponent(asin)}&Quantity.${i + 1}=1`)
    .join("&");
  // AssociateTag is the correct parameter for the cart endpoint;
  // tag is included as a fallback for Amazon's general affiliate tracking.
  return `https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=${AFFILIATE_TAG}&tag=${AFFILIATE_TAG}&${itemParams}`;
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

  // Build Amazon cart URL for selected items
  const cartUrl = useMemo(() => {
    const selectedAsins = pricedAlts
      .filter((a) => selected.has(a.asin))
      .map((a) => a.asin);
    return buildAmazonCartUrl(selectedAsins);
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

          {/* One-click cart button */}
          {cartUrl && (
            <a
              href={cartUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => {
                trackEvent("one_click_cart", {
                  kit_id: kitId,
                  kit_name: kitName,
                  item_count: selectedCount,
                  total_price: totalSelected.toFixed(2),
                  savings: savings.toFixed(2),
                });
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#FF9900] hover:bg-[#E88B00] text-white text-sm font-semibold transition-all duration-200 hover:shadow-md hover:shadow-[#FF9900]/20 active:scale-[0.98]"
              aria-label={`Add ${selectedCount} items to Amazon cart for $${totalSelected.toFixed(2)}`}
            >
              <ShoppingCart className="w-4 h-4" aria-hidden="true" />
              {t(
                `一键加入购物车 (${selectedCount} 件)`,
                `Add ${selectedCount} Item${selectedCount > 1 ? "s" : ""} to Cart`
              )}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
