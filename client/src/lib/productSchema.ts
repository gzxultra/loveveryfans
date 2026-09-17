/**
 * Product Schema (JSON-LD) utilities
 *
 * Generates schema.org Product structured data for Amazon alternatives.
 * This helps search engines understand product details and display
 * rich snippets (price, rating, availability) in search results.
 *
 * Spec: https://schema.org/Product
 */

import type { Alternative } from "@/data/alternatives";

export type AvailabilityStatus =
  | "in_stock"
  | "out_of_stock"
  | "unavailable"
  | "discontinued"
  | "unknown";

// Maps known availability states to schema.org URLs.
// "unknown" is intentionally NOT mapped: buildProductSchema omits the
// availability property entirely when the state is unknown or unmapped,
// instead of fabricating a value (e.g. PreOrder) that we cannot verify.
const AVAILABILITY_MAP: Record<Exclude<AvailabilityStatus, "unknown">, string> = {
  in_stock: "https://schema.org/InStock",
  out_of_stock: "https://schema.org/OutOfStock",
  unavailable: "https://schema.org/OutOfStock",
  discontinued: "https://schema.org/Discontinued",
};

export interface ProductSchemaData {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  url: string;
  image?: string;
  offers?: {
    "@type": string;
    price: string;
    priceCurrency: string;
    availability?: string;
    url: string;
    seller: {
      "@type": string;
      name: string;
    };
  };
  aggregateRating?: {
    "@type": string;
    ratingValue: string;
    reviewCount: string;
    bestRating: string;
    worstRating: string;
  };
}

/**
 * Generate a schema.org Product JSON-LD object for an Amazon alternative.
 */
export function buildProductSchema(
  alt: Alternative,
  toyName: string,
  availability: AvailabilityStatus = "unknown"
): ProductSchemaData {
  const schema: ProductSchemaData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: alt.name,
    description: alt.reasonEn || `Affordable alternative to Lovevery ${toyName}`,
    url: alt.amazonUrl,
  };

  if (alt.imageUrl) {
    schema.image = alt.imageUrl;
  }

  if (alt.price) {
    const priceStr = String(alt.price).replace(/[^0-9.]/g, "");
    const priceNum = parseFloat(priceStr);
    if (!isNaN(priceNum) && priceNum > 0) {
      // Omit availability when the status is unknown or unmapped —
      // never fabricate a schema.org value we cannot verify.
      const availabilityUrl =
        availability === "unknown"
          ? undefined
          : AVAILABILITY_MAP[availability as Exclude<AvailabilityStatus, "unknown">];
      schema.offers = {
        "@type": "Offer",
        price: priceNum.toFixed(2),
        priceCurrency: "USD",
        url: alt.amazonUrl,
        seller: {
          "@type": "Organization",
          name: "Amazon",
        },
      };
      if (availabilityUrl) {
        schema.offers.availability = availabilityUrl;
      }
    }
  }

  if (alt.rating != null && alt.rating > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: alt.rating.toFixed(1),
      reviewCount: String(alt.reviewCount ?? 1),
      bestRating: "5",
      worstRating: "1",
    };
  }

  return schema;
}

/**
 * Serialize a schema object to a JSON-LD script tag string.
 */
export function schemaToScriptTag(schema: ProductSchemaData): string {
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

/**
 * Inject product schemas into the document head for a list of alternatives.
 * Removes any previously injected schemas first.
 */
export function injectProductSchemas(
  alternatives: Alternative[],
  toyName: string,
  containerId: string
): void {
  // Remove old schemas for this container
  const existing = document.querySelectorAll(
    `script[data-product-schema="${containerId}"]`
  );
  existing.forEach((el) => el.remove());

  // Inject new schemas
  for (const alt of alternatives) {
    if (!alt.price && !alt.rating) continue; // Skip if no useful data

    const normalizedAvailability: AvailabilityStatus =
      alt.availability === "in_stock" ||
      alt.availability === "out_of_stock" ||
      alt.availability === "unavailable" ||
      alt.availability === "discontinued"
        ? alt.availability
        : "unknown";
    const schema = buildProductSchema(alt, toyName, normalizedAvailability);
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-product-schema", containerId);
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }
}

/**
 * Remove all product schemas injected by injectProductSchemas.
 */
export function removeProductSchemas(containerId: string): void {
  const existing = document.querySelectorAll(
    `script[data-product-schema="${containerId}"]`
  );
  existing.forEach((el) => el.remove());
}
