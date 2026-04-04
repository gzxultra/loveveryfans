#!/usr/bin/env python3
"""
Lovevery Play Kit Amazon Alternatives Scraper
=============================================

Searches for affordable Amazon alternatives for each toy in the Lovevery Play Kit
lineup. Uses AI to find product recommendations, then scrapes real Amazon data
(price, rating, reviews, images, availability) for accuracy.

Usage:
    python3 scrape_alternatives.py [options]

Options:
    --kit KIT_ID        Only scrape alternatives for a specific kit (e.g., "looker")
    --output FILE       Output JSON file path (default: lovevery_alternatives.json)
    --update            Update existing data instead of overwriting
    --refresh-prices    Refresh prices/ratings for existing ASINs without AI search
    --check-availability  Check availability status for all existing alternatives
    --verbose           Print detailed progress information

Requirements:
    pip3 install requests beautifulsoup4 openai

Environment:
    OPENAI_API_KEY      Required for AI-powered product search (not for price updates)

Availability Detection:
    The scraper detects the following product states:
    - "in_stock"       : Product is available and has a price
    - "out_of_stock"   : Product page exists but item is unavailable
    - "discontinued"   : Product page returns 404 or is no longer sold
    - "unknown"        : Could not determine availability (scraping blocked, etc.)
"""

import argparse
import json
import os
import sys
import time
import re
from pathlib import Path
from typing import Optional
import random
from datetime import datetime, timezone

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Please install required packages: pip3 install requests beautifulsoup4")
    sys.exit(1)

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False
    print("Warning: openai package not installed. AI-powered search disabled.")
    print("Install with: pip3 install openai")


# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "client" / "src" / "data"
DEFAULT_OUTPUT = PROJECT_ROOT / "scripts" / "lovevery_alternatives.json"

# Search configuration
SEARCH_DELAY_MIN = 2.0   # minimum seconds between Amazon requests
SEARCH_DELAY_MAX = 4.0   # maximum seconds between Amazon requests
MAX_ALTERNATIVES_PER_TOY = 3
MIN_RATING = 4.0
MIN_REVIEWS = 50
MAX_RETRIES = 3
REQUEST_TIMEOUT = 15

# Amazon affiliate tag
AFFILIATE_TAG = "loveveryfans-20"

# Availability status constants
AVAILABILITY_IN_STOCK = "in_stock"
AVAILABILITY_OUT_OF_STOCK = "out_of_stock"
AVAILABILITY_DISCONTINUED = "discontinued"
AVAILABILITY_UNKNOWN = "unknown"

# Phrases that indicate out-of-stock on Amazon product pages
OUT_OF_STOCK_PHRASES = [
    "currently unavailable",
    "this item is currently unavailable",
    "out of stock",
    "not in stock",
    "temporarily out of stock",
    "currently not available",
    "we don't know when or if this item will be back in stock",
]

# Headers to mimic a real browser and avoid blocking
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Cache-Control": "max-age=0",
}


# ============================================================================
# Availability Detection
# ============================================================================

def detect_availability(soup: BeautifulSoup, status_code: int) -> str:
    """
    Detect product availability from a parsed Amazon product page.

    Returns one of: "in_stock", "out_of_stock", "discontinued", "unknown"
    """
    if status_code == 404:
        return AVAILABILITY_DISCONTINUED

    if status_code != 200:
        return AVAILABILITY_UNKNOWN

    page_text = soup.get_text(separator=" ").lower()

    # Check for explicit out-of-stock indicators
    for phrase in OUT_OF_STOCK_PHRASES:
        if phrase in page_text:
            return AVAILABILITY_OUT_OF_STOCK

    # Check for "Add to Cart" or "Buy Now" button — strong in-stock signal
    add_to_cart = soup.find("input", {"id": "add-to-cart-button"})
    buy_now = soup.find("input", {"id": "buy-now-button"})
    if add_to_cart or buy_now:
        return AVAILABILITY_IN_STOCK

    # Check availability message div
    avail_div = soup.find("div", {"id": "availability"})
    if avail_div:
        avail_text = avail_div.get_text(separator=" ").lower().strip()
        if any(phrase in avail_text for phrase in OUT_OF_STOCK_PHRASES):
            return AVAILABILITY_OUT_OF_STOCK
        if "in stock" in avail_text or "ships" in avail_text or "order" in avail_text:
            return AVAILABILITY_IN_STOCK

    # If we found a price, assume in stock
    price_elem = soup.find("span", {"class": "a-price-whole"})
    if price_elem:
        return AVAILABILITY_IN_STOCK

    return AVAILABILITY_UNKNOWN


# ============================================================================
# Amazon Data Scraping
# ============================================================================

def scrape_amazon_product(asin: str, verbose: bool = False) -> Optional[dict]:
    """
    Scrape real product data from an Amazon product page.

    Returns a dict with:
        price         : str or None  (e.g. "$19.99")
        rating        : float or None
        reviewCount   : int or None
        imageUrl      : str or None
        availability  : str  (one of AVAILABILITY_* constants)
        lastChecked   : str  (ISO 8601 UTC timestamp)

    Returns None only on unrecoverable network errors.
    """
    url = f"https://www.amazon.com/dp/{asin}"
    last_checked = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    for attempt in range(MAX_RETRIES):
        try:
            if verbose:
                print(
                    f"      Fetching Amazon page for ASIN {asin} "
                    f"(attempt {attempt + 1}/{MAX_RETRIES})..."
                )

            # Random delay to avoid rate limiting
            time.sleep(random.uniform(SEARCH_DELAY_MIN, SEARCH_DELAY_MAX))

            response = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)

            if response.status_code == 503:
                if verbose:
                    print("      Amazon returned 503 (rate limited), waiting longer...")
                time.sleep(10)
                continue

            soup = BeautifulSoup(response.content, "html.parser")
            availability = detect_availability(soup, response.status_code)

            if response.status_code == 404:
                if verbose:
                    print(f"      ASIN {asin} returned 404 — product discontinued")
                return {
                    "price": None,
                    "rating": None,
                    "reviewCount": None,
                    "imageUrl": None,
                    "availability": AVAILABILITY_DISCONTINUED,
                    "lastChecked": last_checked,
                }

            if response.status_code != 200:
                if verbose:
                    print(f"      Failed with status code {response.status_code}")
                continue

            # ── Extract price ────────────────────────────────────────────────
            price = None
            price_selectors = [
                ("span", {"class": "a-price-whole"}),
                ("span", {"class": "a-offscreen"}),
                ("span", {"id": "priceblock_ourprice"}),
                ("span", {"id": "priceblock_dealprice"}),
                ("span", {"class": "a-color-price"}),
            ]
            for tag, attrs in price_selectors:
                price_elem = soup.find(tag, attrs)
                if price_elem:
                    price_text = price_elem.get_text().strip()
                    price_match = re.search(r"\$?(\d+\.?\d*)", price_text)
                    if price_match:
                        price = f"${price_match.group(1)}"
                        break

            # ── Extract rating ───────────────────────────────────────────────
            rating = None
            rating_elem = soup.find("span", {"class": "a-icon-alt"})
            if rating_elem:
                rating_text = rating_elem.get_text().strip()
                rating_match = re.search(r"(\d+\.?\d*)\s*out of", rating_text)
                if rating_match:
                    rating = float(rating_match.group(1))

            # ── Extract review count ─────────────────────────────────────────
            review_count = None
            review_patterns = [
                (r"([\d,]+)\s*global ratings", soup.find_all("span", class_="a-size-base")),
                (r"([\d,]+)\s*ratings", soup.find_all("span", id="acrCustomerReviewText")),
                (r"([\d,]+)\s*ratings", soup.find_all("span")),
            ]
            for pattern, elements in review_patterns:
                for elem in elements:
                    text = elem.get_text().strip()
                    match = re.search(pattern, text)
                    if match:
                        review_count = int(match.group(1).replace(",", ""))
                        break
                if review_count:
                    break

            # ── Extract main product image ───────────────────────────────────
            image_url = None
            image_selectors = [
                ("img", {"id": "landingImage"}),
                ("img", {"class": "a-dynamic-image"}),
                ("div", {"id": "imgTagWrapperId"}),
            ]
            for tag, attrs in image_selectors:
                img_elem = soup.find(tag, attrs)
                if img_elem:
                    if tag == "img":
                        image_url = img_elem.get("data-old-hires") or img_elem.get("src")
                    else:
                        img_tag = img_elem.find("img")
                        if img_tag:
                            image_url = img_tag.get("data-old-hires") or img_tag.get("src")
                    if image_url:
                        # Remove size parameters for higher quality
                        image_url = re.sub(r"\._.*?_\.", ".", image_url)
                        break

            # Validate we got at least some data
            if not price and not rating and availability == AVAILABILITY_UNKNOWN:
                if verbose:
                    print("      Could not extract price or rating from page")
                continue

            result = {
                "price": price,
                "rating": rating,
                "reviewCount": review_count,
                "imageUrl": image_url,
                "availability": availability,
                "lastChecked": last_checked,
            }

            if verbose:
                print(
                    f"      ✓ Scraped: price={price}, rating={rating}, "
                    f"reviews={review_count}, availability={availability}, "
                    f"image={bool(image_url)}"
                )

            return result

        except requests.exceptions.Timeout:
            if verbose:
                print("      Request timeout, retrying...")
            continue
        except Exception as e:
            if verbose:
                print(f"      Error scraping Amazon: {e}")
            continue

    if verbose:
        print(f"      ✗ Failed to scrape after {MAX_RETRIES} attempts")
    return None


# ============================================================================
# Toy Inventory Extraction
# ============================================================================

def extract_toy_inventory() -> list[dict]:
    """Extract toy inventory from kits.ts TypeScript file."""
    kits_file = DATA_DIR / "kits.ts"
    if not kits_file.exists():
        print(f"Error: {kits_file} not found")
        sys.exit(1)

    content = kits_file.read_text(encoding="utf-8")
    lines = content.split("\n")

    all_kits = []
    kit_id = None
    kit_name = None
    toys = []

    for line in lines:
        id_match = re.search(r'^\s*id:\s*"([^"]+)"', line)
        name_match = re.search(r'^\s*name:\s*"([^"]+)"', line)
        en_name_match = re.search(r'englishName:\s*"([^"]+)"', line)

        if id_match and "kit" not in line.lower():
            if kit_id and toys:
                all_kits.append({"kitId": kit_id, "kitName": kit_name, "toys": toys})
                toys = []
            kit_id = id_match.group(1)

        if name_match and not en_name_match and "englishName" not in line:
            if kit_id and (not kit_name or "The " in name_match.group(1)):
                kit_name = name_match.group(1)

        if en_name_match:
            cn_name = re.search(r'name:\s*"([^"]+)"', line)
            category = re.search(r'category:\s*"([^"]+)"', line)
            cat_en = re.search(r'categoryEn:\s*"([^"]+)"', line)
            toys.append(
                {
                    "name": cn_name.group(1) if cn_name else "",
                    "englishName": en_name_match.group(1),
                    "category": category.group(1) if category else "",
                    "categoryEn": cat_en.group(1) if cat_en else "",
                }
            )

    if kit_id and toys:
        all_kits.append({"kitId": kit_id, "kitName": kit_name, "toys": toys})

    return all_kits


# ============================================================================
# AI-Powered Alternative Search
# ============================================================================

def search_alternatives_with_ai(
    toy_name: str, toy_category: str, kit_name: str
) -> list[dict]:
    """
    Use OpenAI API to find Amazon alternatives (ASINs only).
    Real prices/ratings/availability will be scraped separately.
    """
    if not HAS_OPENAI:
        return []

    client = OpenAI()

    prompt = f"""Find 1-3 high-quality, affordable Amazon alternatives for this Lovevery toy:

Toy: {toy_name}
Category: {toy_category}
From Kit: {kit_name}

Requirements:
- Must be available on Amazon US
- Safe materials (BPA-free, non-toxic)
- Similar developmental purpose
- Good value for money

For each alternative, provide:
1. Product name (as listed on Amazon)
2. ASIN (the 10-character Amazon product ID, format: B0XXXXXXXXX or B00XXXXXXX)
3. Brief reason why it's a good alternative (in English)
4. Brief reason in Chinese

Return ONLY a JSON array (no markdown, no explanation):
[
  {{
    "name": "Product Name",
    "asin": "B0XXXXXXXXX",
    "reasonEn": "English reason",
    "reasonCn": "中文原因"
  }}
]

IMPORTANT: Do NOT include price, rating, reviewCount, or availability — we scrape those separately.
If you cannot find suitable alternatives, return an empty array: []
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful assistant that finds Amazon product alternatives "
                        "for baby/toddler toys. Always return valid JSON arrays only. "
                        "Do not include prices, ratings, or availability."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=2000,
        )

        result = response.choices[0].message.content.strip()

        # Clean up markdown code blocks if present
        if result.startswith("```"):
            result = re.sub(r"^```(?:json)?\n?", "", result)
            result = re.sub(r"\n?```$", "", result)

        alternatives = json.loads(result)
        if isinstance(alternatives, list):
            return alternatives[:MAX_ALTERNATIVES_PER_TOY]
        return []

    except Exception as e:
        print(f"  AI search error for '{toy_name}': {e}")
        return []


# ============================================================================
# Main Scraping Logic
# ============================================================================

def scrape_kit_alternatives(
    kit: dict,
    existing_data: Optional[dict] = None,
    refresh_prices: bool = False,
    check_availability: bool = False,
    verbose: bool = False,
) -> dict:
    """Scrape Amazon alternatives for all toys in a kit."""
    kit_id = kit["kitId"]
    kit_name = kit["kitName"]

    result = {"kitId": kit_id, "kitName": kit_name, "toys": []}

    for i, toy in enumerate(kit["toys"]):
        toy_name = toy["englishName"]
        toy_cn = toy["name"]
        category = toy.get("categoryEn", toy.get("category", ""))

        if verbose:
            print(f"  [{i+1}/{len(kit['toys'])}] Processing: {toy_name}")

        # Check if we already have data for this toy
        existing_toy = None
        if existing_data:
            existing_toy = next(
                (t for t in existing_data.get("toys", []) if t["toyName"] == toy_name),
                None,
            )

        alternatives = []

        if (refresh_prices or check_availability) and existing_toy and existing_toy.get("alternatives"):
            # Refresh mode: keep existing ASINs, update prices/ratings/availability
            mode = "availability" if check_availability else "prices"
            if verbose:
                print(
                    f"    Refreshing {mode} for "
                    f"{len(existing_toy['alternatives'])} existing alternatives"
                )

            for alt in existing_toy["alternatives"]:
                asin = alt.get("asin")
                if not asin:
                    continue

                amazon_data = scrape_amazon_product(asin, verbose=verbose)

                if amazon_data:
                    updated_alt = {
                        "name": alt.get("name", ""),
                        "asin": asin,
                        "price": amazon_data.get("price") or alt.get("price"),
                        "rating": amazon_data.get("rating") or alt.get("rating"),
                        "reviewCount": amazon_data.get("reviewCount") or alt.get("reviewCount"),
                        "imageUrl": amazon_data.get("imageUrl") or alt.get("imageUrl"),
                        "amazonUrl": f"https://www.amazon.com/dp/{asin}?tag={AFFILIATE_TAG}",
                        "reasonEn": alt.get("reasonEn", ""),
                        "reasonCn": alt.get("reasonCn", ""),
                        "availability": amazon_data.get("availability", AVAILABILITY_UNKNOWN),
                        "lastChecked": amazon_data.get("lastChecked", ""),
                    }
                    alternatives.append(updated_alt)

                    # Log out-of-stock / discontinued items
                    avail = amazon_data.get("availability", AVAILABILITY_UNKNOWN)
                    if avail in (AVAILABILITY_OUT_OF_STOCK, AVAILABILITY_DISCONTINUED):
                        print(
                            f"    ⚠️  {avail.upper()}: {alt.get('name', asin)} "
                            f"(ASIN: {asin})"
                        )
                else:
                    # Keep existing data if scraping failed, preserve availability
                    alternatives.append(alt)

        elif existing_toy and existing_toy.get("alternatives") and not refresh_prices:
            # Use existing data without refresh
            if verbose:
                print(
                    f"    Using existing data ({len(existing_toy['alternatives'])} alternatives)"
                )
            alternatives = existing_toy["alternatives"]

        else:
            # Search for new alternatives with AI
            if verbose:
                print("    Searching for new alternatives...")

            ai_alternatives = search_alternatives_with_ai(toy_name, category, kit_name)

            for alt in ai_alternatives:
                asin = alt.get("asin")
                if not asin:
                    continue

                amazon_data = scrape_amazon_product(asin, verbose=verbose)

                if amazon_data:
                    full_alt = {
                        "name": alt.get("name", ""),
                        "asin": asin,
                        "price": amazon_data.get("price", "N/A"),
                        "rating": amazon_data.get("rating"),
                        "reviewCount": amazon_data.get("reviewCount"),
                        "imageUrl": amazon_data.get("imageUrl"),
                        "amazonUrl": f"https://www.amazon.com/dp/{asin}?tag={AFFILIATE_TAG}",
                        "reasonEn": alt.get("reasonEn", ""),
                        "reasonCn": alt.get("reasonCn", ""),
                        "availability": amazon_data.get("availability", AVAILABILITY_UNKNOWN),
                        "lastChecked": amazon_data.get("lastChecked", ""),
                    }
                    alternatives.append(full_alt)
                else:
                    if verbose:
                        print(f"      Skipping {asin} — could not scrape data")

        toy_result = {
            "toyName": toy_name,
            "toyNameCn": toy_cn,
            "alternatives": alternatives,
        }
        result["toys"].append(toy_result)

        if verbose:
            print(f"    ✓ Total alternatives: {len(alternatives)}")

    return result


# ============================================================================
# Availability Report
# ============================================================================

def print_availability_report(results: list[dict]) -> None:
    """Print a summary of availability issues found."""
    out_of_stock = []
    discontinued = []

    for kit in results:
        for toy in kit["toys"]:
            for alt in toy.get("alternatives", []):
                avail = alt.get("availability", AVAILABILITY_UNKNOWN)
                entry = {
                    "kit": kit["kitId"],
                    "toy": toy["toyName"],
                    "name": alt.get("name", ""),
                    "asin": alt.get("asin", ""),
                }
                if avail == AVAILABILITY_OUT_OF_STOCK:
                    out_of_stock.append(entry)
                elif avail == AVAILABILITY_DISCONTINUED:
                    discontinued.append(entry)

    if discontinued:
        print(f"\n{'='*50}")
        print(f"⛔ DISCONTINUED ({len(discontinued)} items):")
        for item in discontinued:
            print(f"  [{item['kit']}] {item['toy']} → {item['name']} (ASIN: {item['asin']})")

    if out_of_stock:
        print(f"\n{'='*50}")
        print(f"⚠️  OUT OF STOCK ({len(out_of_stock)} items):")
        for item in out_of_stock:
            print(f"  [{item['kit']}] {item['toy']} → {item['name']} (ASIN: {item['asin']})")

    if not discontinued and not out_of_stock:
        print("\n✅ All alternatives appear to be in stock.")


# ============================================================================
# CLI Entry Point
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Scrape Amazon alternatives for Lovevery Play Kit toys",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Full scrape (AI + Amazon data)
  python3 scrape_alternatives.py --verbose

  # Refresh prices only for a single kit
  python3 scrape_alternatives.py --kit looker --refresh-prices --verbose

  # Check availability for all existing alternatives
  python3 scrape_alternatives.py --check-availability --update --verbose
""",
    )
    parser.add_argument("--kit", type=str, help="Only scrape a specific kit (e.g., 'looker')")
    parser.add_argument(
        "--output",
        type=str,
        default=str(DEFAULT_OUTPUT),
        help="Output JSON file path",
    )
    parser.add_argument(
        "--update",
        action="store_true",
        help="Update existing data instead of overwriting",
    )
    parser.add_argument(
        "--refresh-prices",
        action="store_true",
        help="Refresh prices/ratings for existing ASINs (no AI search needed)",
    )
    parser.add_argument(
        "--check-availability",
        action="store_true",
        help="Check availability status for all existing alternatives",
    )
    parser.add_argument("--verbose", action="store_true", help="Print detailed progress")
    args = parser.parse_args()

    # Extract toy inventory
    print("Extracting toy inventory from kits.ts...")
    inventory = extract_toy_inventory()
    print(
        f"Found {len(inventory)} kits with "
        f"{sum(len(k['toys']) for k in inventory)} toys"
    )

    # Filter by kit if specified
    if args.kit:
        inventory = [k for k in inventory if k["kitId"] == args.kit]
        if not inventory:
            print(f"Error: Kit '{args.kit}' not found")
            sys.exit(1)
        print(f"Filtering to kit: {args.kit}")

    # Load existing data if updating
    existing_data = {}
    should_load_existing = args.update or args.refresh_prices or args.check_availability
    if should_load_existing and os.path.exists(args.output):
        print(f"Loading existing data from {args.output}...")
        with open(args.output) as f:
            existing = json.load(f)
        existing_data = {k["kitId"]: k for k in existing}
        print(f"Loaded data for {len(existing_data)} kits")

    # Scrape alternatives
    results = []
    for i, kit in enumerate(inventory):
        print(f"\n[{i+1}/{len(inventory)}] Processing {kit['kitName']} ({kit['kitId']})...")
        existing_kit = existing_data.get(kit["kitId"])
        result = scrape_kit_alternatives(
            kit,
            existing_kit,
            refresh_prices=args.refresh_prices,
            check_availability=args.check_availability,
            verbose=args.verbose,
        )
        results.append(result)

    # If updating, merge with existing data for kits not processed
    if should_load_existing and existing_data:
        result_ids = {r["kitId"] for r in results}
        for kit_id, kit_data in existing_data.items():
            if kit_id not in result_ids:
                results.append(kit_data)

    # Sort by kit order
    kit_order = [k["kitId"] for k in extract_toy_inventory()]
    results.sort(
        key=lambda x: kit_order.index(x["kitId"]) if x["kitId"] in kit_order else 999
    )

    # Save results
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    # Print summary
    total_toys = sum(len(k["toys"]) for k in results)
    total_alts = sum(
        len(t.get("alternatives", [])) for k in results for t in k["toys"]
    )
    toys_with_alts = sum(1 for k in results for t in k["toys"] if t.get("alternatives"))
    alts_with_images = sum(
        1
        for k in results
        for t in k["toys"]
        for a in t.get("alternatives", [])
        if a.get("imageUrl")
    )
    alts_in_stock = sum(
        1
        for k in results
        for t in k["toys"]
        for a in t.get("alternatives", [])
        if a.get("availability") == AVAILABILITY_IN_STOCK
    )
    alts_out_of_stock = sum(
        1
        for k in results
        for t in k["toys"]
        for a in t.get("alternatives", [])
        if a.get("availability") == AVAILABILITY_OUT_OF_STOCK
    )
    alts_discontinued = sum(
        1
        for k in results
        for t in k["toys"]
        for a in t.get("alternatives", [])
        if a.get("availability") == AVAILABILITY_DISCONTINUED
    )

    print(f"\n{'='*50}")
    print("Scraping Complete!")
    print(f"{'='*50}")
    print(f"Kits processed:              {len(results)}")
    print(f"Total toys:                  {total_toys}")
    print(f"Total alternatives found:    {total_alts}")
    print(f"Alternatives with images:    {alts_with_images}/{total_alts}")
    print(f"Toys with alternatives:      {toys_with_alts} ({toys_with_alts*100//max(total_toys,1)}%)")
    if alts_in_stock or alts_out_of_stock or alts_discontinued:
        print(f"\nAvailability breakdown:")
        print(f"  ✅ In stock:              {alts_in_stock}")
        print(f"  ⚠️  Out of stock:          {alts_out_of_stock}")
        print(f"  ⛔ Discontinued:          {alts_discontinued}")
        print(f"  ❓ Unknown:               {total_alts - alts_in_stock - alts_out_of_stock - alts_discontinued}")
    print(f"\nOutput saved to: {output_path}")
    print(f"File size: {output_path.stat().st_size / 1024:.1f} KB")

    # Print availability report if checking
    if args.check_availability or args.refresh_prices:
        print_availability_report(results)


if __name__ == "__main__":
    main()
