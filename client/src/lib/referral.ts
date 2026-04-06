/**
 * Referral URL utilities for Loveveryfans
 *
 * Centralizes the referral code and URL construction logic
 * to ensure all outbound Lovevery links carry the referral code.
 */

export const REFERRAL_CODE = "REF-6AA44A5A";
export const AMAZON_AFFILIATE_TAG = "loveveryfans-20";

/**
 * Append the Lovevery referral code and UTM parameters to any lovevery.com URL.
 * If the URL already contains a discount_code parameter, it is replaced.
 */
export function appendLoveveryReferral(
  url: string,
  campaign: string = "general"
): string {
  // Only process lovevery.com URLs
  if (!url.includes("lovevery.com")) return url;

  // Remove existing discount_code if present
  let cleanUrl = url.replace(/[?&]discount_code=[^&]*/g, "");
  // Remove existing utm params to avoid duplication
  cleanUrl = cleanUrl.replace(/[?&]utm_source=[^&]*/g, "");
  cleanUrl = cleanUrl.replace(/[?&]utm_medium=[^&]*/g, "");
  cleanUrl = cleanUrl.replace(/[?&]utm_campaign=[^&]*/g, "");

  // Clean up any trailing ? or & from removal
  cleanUrl = cleanUrl.replace(/[?&]$/, "");

  const separator = cleanUrl.includes("?") ? "&" : "?";
  return `${cleanUrl}${separator}discount_code=${REFERRAL_CODE}&utm_source=loveveryfans&utm_medium=referral&utm_campaign=${campaign}`;
}

/**
 * Build a purchase URL for a specific kit.
 */
export function getKitPurchaseUrl(kitSlug: string): string {
  return appendLoveveryReferral(
    `https://lovevery.com/products/the-play-kits-the-${kitSlug}`,
    `kit_${kitSlug}`
  );
}

/**
 * Build a referral program URL.
 */
export function getReferralProgramUrl(): string {
  return appendLoveveryReferral(
    "https://lovevery.com/pages/refer-a-friend",
    "refer_friend"
  );
}

/**
 * Build a product purchase URL.
 */
export function getProductPurchaseUrl(productId: string, officialUrl: string): string {
  return appendLoveveryReferral(officialUrl, `product_${productId}`);
}

/**
 * Ensure an Amazon URL has the affiliate tag.
 */
export function ensureAmazonTag(url: string): string {
  if (!url.includes("amazon.com")) return url;
  if (url.includes(`tag=${AMAZON_AFFILIATE_TAG}`)) return url;

  // Remove any existing tag
  const cleanUrl = url.replace(/[?&]tag=[^&]*/g, "").replace(/[?&]$/, "");
  const separator = cleanUrl.includes("?") ? "&" : "?";
  return `${cleanUrl}${separator}tag=${AMAZON_AFFILIATE_TAG}`;
}
