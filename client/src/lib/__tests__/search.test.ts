/**
 * Tests for the FlexSearch-based search module.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  buildSearchIndex,
  search,
  resetSearchIndex,
} from "../search";
import type { KitAlternative } from "@/data/alternatives";
import type { BlogPost } from "@/data/blogPosts";

// ============================================================================
// Test fixtures
// ============================================================================

const mockKits = [
  {
    id: "looker",
    name: "The Looker",
    description: "For newborns 0-3 months",
    ageRange: "0-3 个月",
    ageRangeEn: "0-3 months",
  },
  {
    id: "charmer",
    name: "The Charmer",
    description: "For babies 4-6 months",
    ageRange: "4-6 个月",
    ageRangeEn: "4-6 months",
  },
];

const mockAlternatives: KitAlternative[] = [
  {
    kitId: "looker",
    kitName: "The Looker",
    toys: [
      {
        toyName: "High Contrast Cards",
        toyNameCn: "高对比度卡片",
        alternatives: [
          {
            name: "Baby Black and White Flash Cards",
            asin: "B08TEST001",
            price: "$12.99",
            rating: 4.5,
            reviewCount: 1200,
            amazonUrl: "https://www.amazon.com/dp/B08TEST001?tag=loveveryfans-20",
            reasonEn: "Great high contrast cards for newborns",
            reasonCn: "适合新生儿的高对比度卡片",
          },
        ],
      },
    ],
  },
];

const mockBlogPosts: BlogPost[] = [
  {
    slug: "lovevery-worth-it-2026",
    title: "Lovevery 值不值得买？2026 年终极评测",
    titleEn: "Is Lovevery Worth It? The Ultimate 2026 Review",
    date: "2026-01-15",
    author: "Lovevery Fans",
    excerpt: "每个月 $80 的 Play Kit 订阅，到底值不值？",
    excerptEn: "Is an $80/month Play Kit subscription worth it?",
    tags: ["评测", "省钱"],
    tagsEn: ["review", "save money"],
    readingTime: 8,
    content: "Full content here about Lovevery review",
    contentHtml: "<p>Full content here about Lovevery review</p>",
  },
];

// ============================================================================
// Tests
// ============================================================================

describe("search module", () => {
  beforeEach(() => {
    resetSearchIndex();
  });

  describe("buildSearchIndex", () => {
    it("builds the index without errors", () => {
      expect(() =>
        buildSearchIndex(mockKits, mockAlternatives, mockBlogPosts)
      ).not.toThrow();
    });

    it("is idempotent — calling twice does not throw or duplicate results", () => {
      buildSearchIndex(mockKits, mockAlternatives, mockBlogPosts);
      buildSearchIndex(mockKits, mockAlternatives, mockBlogPosts);
      const results = search("Looker");
      expect(results.kits.length).toBe(1);
    });
  });

  describe("search", () => {
    beforeEach(() => {
      buildSearchIndex(mockKits, mockAlternatives, mockBlogPosts);
    });

    it("returns empty results for empty query", () => {
      const results = search("");
      expect(results.total).toBe(0);
      expect(results.kits).toHaveLength(0);
      expect(results.alternatives).toHaveLength(0);
      expect(results.blogs).toHaveLength(0);
    });

    it("returns empty results for whitespace-only query", () => {
      const results = search("   ");
      expect(results.total).toBe(0);
    });

    it("finds kits by name", () => {
      const results = search("Looker");
      expect(results.kits.length).toBeGreaterThan(0);
      expect(results.kits[0].type).toBe("kit");
      expect(results.kits[0].url).toBe("/kit/looker/");
    });

    it("finds kits by age range", () => {
      const results = search("0-3 months");
      expect(results.kits.length).toBeGreaterThan(0);
    });

    it("finds alternatives by product name", () => {
      const results = search("Flash Cards");
      expect(results.alternatives.length).toBeGreaterThan(0);
      expect(results.alternatives[0].type).toBe("alternative");
    });

    it("finds alternatives by reason text", () => {
      const results = search("newborns");
      expect(results.alternatives.length).toBeGreaterThan(0);
    });

    it("finds blog posts by title", () => {
      const results = search("Lovevery Worth");
      expect(results.blogs.length).toBeGreaterThan(0);
      expect(results.blogs[0].type).toBe("blog");
      expect(results.blogs[0].url).toContain("/blog/");
    });

    it("finds blog posts by Chinese title", () => {
      const results = search("值不值得买");
      expect(results.blogs.length).toBeGreaterThan(0);
    });

    it("returns correct URL for kit results", () => {
      const results = search("Charmer");
      const kitResult = results.kits.find((k) => k.id === "kit:charmer");
      expect(kitResult?.url).toBe("/kit/charmer/");
    });

    it("returns correct URL for alternative results (Amazon link)", () => {
      const results = search("Baby Black and White");
      expect(results.alternatives.length).toBeGreaterThan(0);
      expect(results.alternatives[0].url).toContain("amazon.com");
    });

    it("does not return duplicate alternatives for same ASIN", () => {
      // Add same ASIN in a second kit
      const alternativesWithDuplicate: KitAlternative[] = [
        ...mockAlternatives,
        {
          kitId: "charmer",
          kitName: "The Charmer",
          toys: [
            {
              toyName: "High Contrast Cards",
              toyNameCn: "高对比度卡片",
              alternatives: [
                {
                  name: "Baby Black and White Flash Cards",
                  asin: "B08TEST001", // same ASIN
                  price: "$12.99",
                  rating: 4.5,
                  reviewCount: 1200,
                  amazonUrl: "https://www.amazon.com/dp/B08TEST001?tag=loveveryfans-20",
                  reasonEn: "Great high contrast cards for newborns",
                  reasonCn: "适合新生儿的高对比度卡片",
                },
              ],
            },
          ],
        },
      ];

      resetSearchIndex();
      buildSearchIndex(mockKits, alternativesWithDuplicate, []);
      const results = search("Flash Cards");
      const ids = results.alternatives.map((r) => r.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it("returns grouped results with correct structure", () => {
      const results = search("Lovevery");
      expect(results).toHaveProperty("kits");
      expect(results).toHaveProperty("alternatives");
      expect(results).toHaveProperty("blogs");
      expect(results).toHaveProperty("total");
      expect(typeof results.total).toBe("number");
    });

    it("total equals sum of all group lengths", () => {
      const results = search("Lovevery");
      expect(results.total).toBe(
        results.kits.length + results.alternatives.length + results.blogs.length
      );
    });
  });

  describe("resetSearchIndex", () => {
    it("allows rebuilding the index after reset", () => {
      buildSearchIndex(mockKits, mockAlternatives, mockBlogPosts);
      resetSearchIndex();
      buildSearchIndex(mockKits, [], []);
      const results = search("Flash Cards");
      // After reset and rebuild with no alternatives, should find nothing
      expect(results.alternatives).toHaveLength(0);
    });
  });
});
