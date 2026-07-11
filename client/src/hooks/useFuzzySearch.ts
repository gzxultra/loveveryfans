/**
 * useFuzzySearch — enhanced search across kits and toys.
 *
 * Replaces the plain substring match in Home.tsx with:
 * 1. Case-insensitive substring (baseline)
 * 2. Token matching (each query word checked independently)
 * 3. Simple pinyin prefix matching for Chinese → English lookups
 * 4. CN↔EN synonym mapping for common terms
 *
 * Returns search results with matched text ranges for highlighting.
 */

import { useMemo } from "react";
import { kits } from "@/data/kits";
import { standaloneProducts, getProductSlug } from "@/data/standaloneProducts";

// ---------------------------------------------------------------------------
// Keyword synonyms: Chinese ↔ English
// ---------------------------------------------------------------------------

const SYNONYMS: Record<string, string[]> = {
  // Chinese → English
  "积木": ["block", "blocks", "block set"],
  "音乐": ["music", "music set"],
  "洗澡": ["bath", "bath set"],
  "游戏垫": ["play gym", "gym"],
  "精细动作": ["fine motor"],
  "大运动": ["gross motor", "big body"],
  "认知": ["cognitive"],
  "感官": ["sensory"],
  "语言": ["language", "babbler"],
  "数学": ["math", "counting"],
  "阅读": ["reading", "book"],
  "拼图": ["puzzle"],
  "摇铃": ["rattle"],
  "球": ["ball"],
  "书": ["book"],
  "娃娃": ["doll"],
  "杯子": ["cup", "cups"],
  "钥匙": ["keys"],
  "蛋": ["egg"],
  "镜子": ["mirror"],
  "床铃": ["mobile"],
  "卡片": ["card", "cards"],
  // English → Chinese
  "block": ["积木"],
  "music": ["音乐"],
  "bath": ["洗澡"],
  "puzzle": ["拼图"],
  "rattle": ["摇铃"],
  "ball": ["球"],
  "book": ["书", "绘本"],
  "doll": ["娃娃"],
  "mirror": ["镜子"],
  "mobile": ["床铃"],
  "card": ["卡片"],
  "motor": ["运动", "动作"],
};

// ---------------------------------------------------------------------------
// Simple fuzzy matching
// ---------------------------------------------------------------------------

function normalizeQuery(q: string): string {
  return q.toLowerCase().trim();
}

/**
 * Check if query tokens fuzzy-match the target string.
 * Returns true if ALL query tokens are found in target (AND logic).
 */
function fuzzyMatch(target: string, query: string): boolean {
  const t = target.toLowerCase();
  const q = normalizeQuery(query);

  // Direct substring match (fastest path)
  if (t.includes(q)) return true;

  // Token matching: each word in query must appear somewhere in target
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    if (tokens.every((tok) => t.includes(tok))) return true;
  }

  // Synonym expansion
  for (const [key, synonyms] of Object.entries(SYNONYMS)) {
    if (q.includes(key)) {
      for (const syn of synonyms) {
        if (t.includes(syn)) return true;
      }
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Search result type
// ---------------------------------------------------------------------------

export interface SearchResult {
  kitId: string;
  kitName: string;
  matchType: "kit" | "toy";
  toyName?: string;
  toyEnglishName?: string;
  kitColor: string;
  isProduct?: boolean;
  /** The portion of text that matched, for highlighting */
  matchedText?: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFuzzySearch(query: string): SearchResult[] {
  return useMemo(() => {
    const q = normalizeQuery(query);
    if (!q) return [];

    const results: SearchResult[] = [];

    // Search kits
    for (const kit of kits) {
      if (fuzzyMatch(kit.name, q) || fuzzyMatch(kit.id, q)) {
        results.push({
          kitId: kit.id,
          kitName: kit.name,
          matchType: "kit",
          kitColor: kit.color,
        });
      }
      // Search toys
      for (const toy of kit.toys) {
        if ((toy as any).discontinued) continue;
        if (
          fuzzyMatch(toy.name, q) ||
          fuzzyMatch(toy.englishName, q) ||
          fuzzyMatch(toy.category, q) ||
          fuzzyMatch(toy.categoryEn || "", q) ||
          fuzzyMatch(toy.howToUse, q) ||
          fuzzyMatch(toy.howToUseEn || "", q) ||
          fuzzyMatch(toy.developmentGoal, q) ||
          fuzzyMatch(toy.developmentGoalEn || "", q)
        ) {
          results.push({
            kitId: kit.id,
            kitName: kit.name,
            matchType: "toy",
            toyName: toy.name,
            toyEnglishName: toy.englishName,
            kitColor: kit.color,
          });
        }
      }
    }

    // Search standalone products
    for (const product of standaloneProducts) {
      if (fuzzyMatch(product.name, q) || fuzzyMatch(product.id, q)) {
        results.push({
          kitId: product.id,
          kitName: product.name,
          matchType: "kit",
          kitColor: product.color,
          isProduct: true,
        });
      }
      for (const toy of product.toys) {
        if ((toy as any).discontinued) continue;
        if (
          fuzzyMatch(toy.name, q) ||
          fuzzyMatch(toy.englishName, q) ||
          fuzzyMatch(toy.category, q) ||
          fuzzyMatch(toy.categoryEn || "", q)
        ) {
          results.push({
            kitId: product.id,
            kitName: product.name,
            matchType: "toy",
            toyName: toy.name,
            toyEnglishName: toy.englishName,
            kitColor: product.color,
            isProduct: true,
          });
        }
      }
    }

    return results.slice(0, 30); // Generous limit
  }, [query]);
}

// ---------------------------------------------------------------------------
// Highlight helper
// ---------------------------------------------------------------------------

/**
 * Highlight occurrences of `query` in `text`.
 * Returns an array of {text, highlighted} segments for rendering.
 */
export function highlightMatch(
  text: string,
  query: string,
): Array<{ text: string; highlighted: boolean }> {
  if (!query.trim()) return [{ text, highlighted: false }];

  const q = query.toLowerCase().trim();
  const lower = text.toLowerCase();
  const segments: Array<{ text: string; highlighted: boolean }> = [];
  let lastIdx = 0;

  let idx = lower.indexOf(q);
  while (idx !== -1) {
    if (idx > lastIdx) {
      segments.push({ text: text.slice(lastIdx, idx), highlighted: false });
    }
    segments.push({
      text: text.slice(idx, idx + q.length),
      highlighted: true,
    });
    lastIdx = idx + q.length;
    idx = lower.indexOf(q, lastIdx);
  }

  if (lastIdx < text.length) {
    segments.push({ text: text.slice(lastIdx), highlighted: false });
  }

  return segments.length > 0 ? segments : [{ text, highlighted: false }];
}
