#!/usr/bin/env python3
"""
Tests for scrape_alternatives.py — availability detection, price extraction,
OpenAI graceful degradation, and data extraction.

Run with:
    python3 -m pytest test_scrape_alternatives.py -v
"""

import os
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent))

from bs4 import BeautifulSoup
from scrape_alternatives import (
    detect_availability,
    _extract_price,
    _extract_rating,
    _extract_review_count,
    _extract_image_url,
    can_use_ai_search,
    search_alternatives_with_ai,
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
# _extract_price tests
# ============================================================================

class TestExtractPrice:
    def test_extracts_price_from_core_price_display(self):
        html = """
        <html><body>
          <div id="corePriceDisplay_desktop_feature_div">
            <span class="a-price-whole">19</span>
            <span class="a-price-fraction">99</span>
          </div>
        </body></html>
        """
        soup = make_soup(html)
        price = _extract_price(soup)
        assert price == "$19.99"

    def test_extracts_price_from_offscreen_span(self):
        html = """
        <html><body>
          <span class="a-offscreen">$24.99</span>
        </body></html>
        """
        soup = make_soup(html)
        price = _extract_price(soup)
        assert price == "$24.99"

    def test_extracts_price_from_priceblock_ourprice(self):
        html = """
        <html><body>
          <span id="priceblock_ourprice">$14.99</span>
        </body></html>
        """
        soup = make_soup(html)
        price = _extract_price(soup)
        assert price == "$14.99"

    def test_extracts_price_from_generic_price_whole(self):
        html = """
        <html><body>
          <span class="a-price-whole">32</span>
        </body></html>
        """
        soup = make_soup(html)
        price = _extract_price(soup)
        assert price is not None
        assert price.startswith("$32")

    def test_returns_none_when_no_price(self):
        html = "<html><body><p>No price here.</p></body></html>"
        soup = make_soup(html)
        assert _extract_price(soup) is None

    def test_extracts_price_from_apex_desktop(self):
        html = """
        <html><body>
          <div id="apex_desktop">
            <span class="a-price-whole">9</span>
            <span class="a-price-fraction">95</span>
          </div>
        </body></html>
        """
        soup = make_soup(html)
        price = _extract_price(soup)
        assert price == "$9.95"


# ============================================================================
# _extract_rating tests
# ============================================================================

class TestExtractRating:
    def test_extracts_rating_from_icon_alt(self):
        html = """
        <html><body>
          <span class="a-icon-alt">4.5 out of 5 stars</span>
        </body></html>
        """
        soup = make_soup(html)
        assert _extract_rating(soup) == 4.5

    def test_extracts_rating_from_acr_popover(self):
        html = """
        <html><body>
          <span id="acrPopover" title="4.3 out of 5 stars"></span>
        </body></html>
        """
        soup = make_soup(html)
        assert _extract_rating(soup) == 4.3

    def test_returns_none_when_no_rating(self):
        html = "<html><body><p>No rating here.</p></body></html>"
        soup = make_soup(html)
        assert _extract_rating(soup) is None

    def test_extracts_integer_rating(self):
        html = """
        <html><body>
          <span class="a-icon-alt">5 out of 5 stars</span>
        </body></html>
        """
        soup = make_soup(html)
        assert _extract_rating(soup) == 5.0


# ============================================================================
# _extract_review_count tests
# ============================================================================

class TestExtractReviewCount:
    def test_extracts_from_acr_customer_review_text(self):
        html = """
        <html><body>
          <span id="acrCustomerReviewText">1,234 global ratings</span>
        </body></html>
        """
        soup = make_soup(html)
        assert _extract_review_count(soup) == 1234

    def test_extracts_from_a_size_base_global_ratings(self):
        html = """
        <html><body>
          <span class="a-size-base">5,678 global ratings</span>
        </body></html>
        """
        soup = make_soup(html)
        assert _extract_review_count(soup) == 5678

    def test_returns_none_when_no_reviews(self):
        html = "<html><body><p>No reviews.</p></body></html>"
        soup = make_soup(html)
        assert _extract_review_count(soup) is None

    def test_handles_large_numbers_with_commas(self):
        html = """
        <html><body>
          <span id="acrCustomerReviewText">12,345 global ratings</span>
        </body></html>
        """
        soup = make_soup(html)
        assert _extract_review_count(soup) == 12345


# ============================================================================
# _extract_image_url tests
# ============================================================================

class TestExtractImageUrl:
    def test_extracts_from_landing_image(self):
        html = """
        <html><body>
          <img id="landingImage" src="https://example.com/image._SL500_.jpg" />
        </body></html>
        """
        soup = make_soup(html)
        url = _extract_image_url(soup)
        assert url is not None
        assert "example.com" in url

    def test_extracts_data_old_hires_over_src(self):
        html = """
        <html><body>
          <img id="landingImage"
               src="https://example.com/small.jpg"
               data-old-hires="https://example.com/large.jpg" />
        </body></html>
        """
        soup = make_soup(html)
        url = _extract_image_url(soup)
        assert url == "https://example.com/large.jpg"

    def test_strips_size_parameters(self):
        html = """
        <html><body>
          <img id="landingImage" src="https://example.com/image._SL500_.jpg" />
        </body></html>
        """
        soup = make_soup(html)
        url = _extract_image_url(soup)
        assert "_SL500_" not in url

    def test_returns_none_when_no_image(self):
        html = "<html><body><p>No image.</p></body></html>"
        soup = make_soup(html)
        assert _extract_image_url(soup) is None


# ============================================================================
# OpenAI graceful degradation tests
# ============================================================================

class TestOpenAIGracefulDegradation:
    def test_can_use_ai_search_returns_false_without_key(self):
        """can_use_ai_search() must return False when OPENAI_API_KEY is absent."""
        with patch.dict(os.environ, {}, clear=True):
            # Temporarily clear OPENAI_API_KEY
            env_without_key = {k: v for k, v in os.environ.items() if k != "OPENAI_API_KEY"}
            with patch.dict(os.environ, env_without_key, clear=True):
                import scrape_alternatives as sa
                original_key = sa.HAS_OPENAI_KEY
                sa.HAS_OPENAI_KEY = False
                try:
                    assert sa.can_use_ai_search() is False
                finally:
                    sa.HAS_OPENAI_KEY = original_key

    def test_search_alternatives_returns_empty_without_key(self):
        """search_alternatives_with_ai() must return [] when API key is absent."""
        import scrape_alternatives as sa
        original_key = sa.HAS_OPENAI_KEY
        sa.HAS_OPENAI_KEY = False
        try:
            result = search_alternatives_with_ai("Test Toy", "Sensory", "Test Kit")
            assert result == []
        finally:
            sa.HAS_OPENAI_KEY = original_key

    def test_search_alternatives_returns_empty_without_openai_package(self):
        """search_alternatives_with_ai() must return [] when openai is not installed."""
        import scrape_alternatives as sa
        original_has_openai = sa.HAS_OPENAI
        original_key = sa.HAS_OPENAI_KEY
        sa.HAS_OPENAI = False
        sa.HAS_OPENAI_KEY = False
        try:
            result = search_alternatives_with_ai("Test Toy", "Sensory", "Test Kit")
            assert result == []
        finally:
            sa.HAS_OPENAI = original_has_openai
            sa.HAS_OPENAI_KEY = original_key

    def test_can_use_ai_search_returns_true_with_key(self):
        """can_use_ai_search() must return True when both package and key are present."""
        import scrape_alternatives as sa
        original_has_openai = sa.HAS_OPENAI
        original_key = sa.HAS_OPENAI_KEY
        sa.HAS_OPENAI = True
        sa.HAS_OPENAI_KEY = True
        try:
            assert sa.can_use_ai_search() is True
        finally:
            sa.HAS_OPENAI = original_has_openai
            sa.HAS_OPENAI_KEY = original_key

    def test_search_alternatives_handles_api_exception_gracefully(self):
        """search_alternatives_with_ai() must return [] on API errors."""
        import scrape_alternatives as sa
        original_has_openai = sa.HAS_OPENAI
        original_key = sa.HAS_OPENAI_KEY
        sa.HAS_OPENAI = True
        sa.HAS_OPENAI_KEY = True
        try:
            with patch("scrape_alternatives.OpenAI") as mock_openai:
                mock_client = MagicMock()
                mock_client.chat.completions.create.side_effect = Exception("API error")
                mock_openai.return_value = mock_client
                result = search_alternatives_with_ai("Test Toy", "Sensory", "Test Kit")
                assert result == []
        finally:
            sa.HAS_OPENAI = original_has_openai
            sa.HAS_OPENAI_KEY = original_key


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
