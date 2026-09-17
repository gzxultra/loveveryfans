/**
 * ProductBadge — quiet-luxury "new / price drop" capsule badges for product cards
 * and detail pages.
 *
 * - New badge shows when `isNew === true` OR `addedAt` is within 90 days of today
 *   (auto-expires — never hardcode a visible flag into data).
 * - Price-drop badge shows when `priceDropFrom` exists and is greater than the
 *   current `price` (accepts `number` or a currency string like "$59.99").
 * - Renders nothing when neither badge applies.
 *
 * Styling follows the quiet-luxury editorial bar: tiny fine type, small capsule,
 * low-saturation muted tones, theme tokens only (no hardcoded colors) so both
 * light and dark modes stay soft.
 */

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useI18n } from "@/hooks/useI18n";
import { cn } from "@/lib/utils";

/** How long after `addedAt` the "new" badge stays visible. */
const NEW_BADGE_WINDOW_DAYS = 90;

export interface ProductBadgeProps {
  /** ISO date (e.g. "2026-09-17") when the product launched. */
  addedAt?: string;
  /** Explicit "new" flag; takes precedence over `addedAt` expiry. */
  isNew?: boolean;
  /** Original price before a drop; badge shows only when greater than `price`. */
  priceDropFrom?: number;
  /** Current price — number, or a currency string like "$59.99". */
  price?: number | string;
  className?: string;
}

function isWithinDays(isoDate: string, days: number): boolean {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return false;
  const diffMs = Date.now() - parsed.getTime();
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
}

function toPriceNumber(value: number | string | undefined): number | undefined {
  if (value == null) return undefined;
  const num = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, ""));
  return Number.isNaN(num) ? undefined : num;
}

export default function ProductBadge({
  addedAt,
  isNew,
  priceDropFrom,
  price,
  className,
}: ProductBadgeProps) {
  const { lang } = useLanguage();
  const i18n = useI18n();

  const showNew = isNew === true || (addedAt ? isWithinDays(addedAt, NEW_BADGE_WINDOW_DAYS) : false);
  const currentPrice = toPriceNumber(price);
  const showPriceDrop =
    priceDropFrom != null && currentPrice != null && priceDropFrom > currentPrice;

  if (!showNew && !showPriceDrop) return null;

  return (
    <span className={cn("inline-flex items-center gap-1.5 flex-wrap", className)}>
      {showNew && (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5",
            "text-[10px] font-medium tracking-[0.14em]",
            // Mist blue-gray: soft tint + hairline border, stays muted in dark mode
            "border border-chart-3/25 bg-chart-3/10 text-chart-3/90"
          )}
        >
          {i18n.productBadge.new[lang]}
        </span>
      )}
      {showPriceDrop && (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5",
            "text-[10px] font-medium tracking-[0.14em]",
            // Warm gray: theme muted tones, no red, no shouting
            "border border-border bg-muted/70 text-muted-foreground"
          )}
        >
          {i18n.productBadge.priceDrop[lang]}
        </span>
      )}
    </span>
  );
}
