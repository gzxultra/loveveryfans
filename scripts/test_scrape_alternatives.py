#!/usr/bin/env python3
"""
Tests for scrape_alternatives.py — availability detection and data extraction.

Run with:
    python3 -m pytest test_scrape_alternatives.py -v
"""

import sys
import os
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent))

from bs4 import BeautifulSoup
from scrape_alternatives import (
    detect_availability,
    AVAILABILITY_IN_STOCK,
    AVAILABILITY_OUT_OF_STOCK,
    AVAILABILITY_DISCONTINUED,
    AVAILABILITY_UNKNOWN,
    AFFILIATE_TAG,
)


# ============================================================================
# Helpers
# ============================================================================

def make_soup(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "html.parser")


# ============================================================================
# detect_availability tests
# ============================================================================

class TestDetectAvailability:
    def test_returns_discontinued_on_404(self):
        soup = make_soup("<html><body>Not Found</body></html>")
        assert detect_availability(soup, 404) == AVAILABILITY_DISCONTINUED

    def test_returns_unknown_on_non_200_non_404(self):
        soup = make_soup("<html><body>Error</body></html>")
        assert detect_availability(soup, 503) == AVAILABILITY_UNKNOWN

    def test_detects_out_of_stock_phrase(self):
        html = """
        <html><body>
          <div id="availability">
            <span>Currently unavailable.</span>
          </div>
        </body></html>
        """
        soup = make_soup(html)
        assert detect_availability(soup, 200) == AVAILABILITY_OUT_OF_STOCK

    def test_detects_out_of_stock_in_page_text(self):
        html = """
        <html><body>
          <p>We don't know when or if this item will be back in stock.</p>
        </body></html>
        """
        soup = make_soup(html)
        assert detect_availability(soup, 200) == AVAILABILITY_OUT_OF_STOCK

    def test_detects_in_stock_via_add_to_cart(self):
        html = """
        <html><body>
          <input id="add-to-cart-button" type="submit" value="Add to Cart" />
          <span class="a-price-whole">19</span>
        </body></html>
        """
        soup = make_soup(html)
        assert detect_availability(soup, 200) == AVAILABILITY_IN_STOCK

    def test_detects_in_stock_via_buy_now(self):
        html = """
        <html><body>
          <input id="buy-now-button" type="submit" value="Buy Now" />
        </body></html>
        """
        soup = make_soup(html)
        assert detect_availability(soup, 200) == AVAILABILITY_IN_STOCK

    def test_detects_in_stock_via_availability_div(self):
        html = """
        <html><body>
          <div id="availability">
            <span>In Stock.</span>
          </div>
        </body></html>
        """
        soup = make_soup(html)
        assert detect_availability(soup, 200) == AVAILABILITY_IN_STOCK

    def test_detects_in_stock_via_price_element(self):
        html = """
        <html><body>
          <span class="a-price-whole">24</span>
        </body></html>
        """
        soup = make_soup(html)
        assert detect_availability(soup, 200) == AVAILABILITY_IN_STOCK

    def test_returns_unknown_when_no_signals(self):
        html = "<html><body><p>Some product page with no clear signals.</p></body></html>"
        soup = make_soup(html)
        assert detect_availability(soup, 200) == AVAILABILITY_UNKNOWN

    def test_out_of_stock_takes_priority_over_price(self):
        """If page says out of stock but also shows a price, prefer out_of_stock."""
        html = """
        <html><body>
          <span class="a-price-whole">19</span>
          <p>This item is currently unavailable.</p>
        </body></html>
        """
        soup = make_soup(html)
        assert detect_availability(soup, 200) == AVAILABILITY_OUT_OF_STOCK

    def test_availability_div_ships_signal(self):
        html = """
        <html><body>
          <div id="availability">
            <span>Ships within 2-3 days.</span>
          </div>
        </body></html>
        """
        soup = make_soup(html)
        assert detect_availability(soup, 200) == AVAILABILITY_IN_STOCK


# ============================================================================
# Affiliate tag tests
# ============================================================================

class TestAffiliateTag:
    def test_affiliate_tag_constant(self):
        assert AFFILIATE_TAG == "loveveryfans-20"

    def test_amazon_url_format(self):
        asin = "B0BQXJX5GH"
        url = f"https://www.amazon.com/dp/{asin}?tag={AFFILIATE_TAG}"
        assert AFFILIATE_TAG in url
        assert asin in url


# ============================================================================
# Availability constants
# ============================================================================

class TestAvailabilityConstants:
    def test_constants_are_strings(self):
        assert isinstance(AVAILABILITY_IN_STOCK, str)
        assert isinstance(AVAILABILITY_OUT_OF_STOCK, str)
        assert isinstance(AVAILABILITY_DISCONTINUED, str)
        assert isinstance(AVAILABILITY_UNKNOWN, str)

    def test_constants_are_distinct(self):
        statuses = {
            AVAILABILITY_IN_STOCK,
            AVAILABILITY_OUT_OF_STOCK,
            AVAILABILITY_DISCONTINUED,
            AVAILABILITY_UNKNOWN,
        }
        assert len(statuses) == 4


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
