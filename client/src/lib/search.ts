/**
 * FlexSearch-based full-site search
 *
 * Builds a search index from kits, alternatives, and blog posts.
 * Supports both Chinese and English queries.
 * Results are grouped by type: Kit / Alternative / Blog.
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — FlexSearch v0.8 types are declared as a module
import FlexSearch from "flexsearch";
import type { KitAlternative } from "@/data/alternatives";
import type { BlogPost } from "@/data/blogPosts";

// ============================================================================
// Types
// ============================================================================

export type SearchResultType = "kit" | "alternative" | "blog";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  url: string;
}

export interface GroupedSearchResults {
  kits: SearchResult[];
  alternatives: SearchResult[];
  blogs: SearchResult[];
  total: number;
}

// ============================================================================
// Internal entry type (must satisfy DocumentData: { [key: string]: string | string[] | ... })
// ============================================================================

interface IndexEntry {
  id: string;
  type: string;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  url: string;
  text: string;
}

let indexEntries: IndexEntry[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let flexIndex: any = null;
let isBuilt = false;

/**
 * Build the search index from kits, alternatives, and blog posts.
 * Call this once at app startup (lazy, only when search is first used).
 */
export function buildSearchIndex(
  kits: Array<{
    id: string;
    name: string;
    description?: string;
    ageRange: string;
    ageRangeEn?: string;
    descriptionEn?: string;
  }>,
  alternativesData: KitAlternative[],
  blogPostsData: BlogPost[]
): void {
  if (isBuilt) return;

  indexEntries = [];

  // ── Kits ──────────────────────────────────────────────────────────────────
  for (const kit of kits) {
    indexEntries.push({
      id: `kit:${kit.id}`,
      type: "kit",
      title: kit.name,
      titleEn: kit.name,
      subtitle: kit.ageRange,
      subtitleEn: kit.ageRangeEn || kit.ageRange,
      url: `/kit/${kit.id}/`,
      text: [
        kit.name,
        kit.description || "",
        kit.descriptionEn || "",
        kit.ageRange,
        kit.ageRangeEn || "",
      ].join(" "),
    });
  }

  // ── Alternatives ──────────────────────────────────────────────────────────
  for (const kitData of alternativesData) {
    for (const toy of kitData.toys) {
      for (const alt of toy.alternatives) {
        const entryId = `alt:${alt.asin}`;
        // Avoid duplicates (same ASIN in multiple kits)
        if (indexEntries.some((e) => e.id === entryId)) continue;

        indexEntries.push({
          id: entryId,
          type: "alternative",
          title: alt.name,
          titleEn: alt.name,
          subtitle: toy.toyNameCn || toy.toyName,
          subtitleEn: toy.toyName,
          url: alt.amazonUrl,
          text: [
            alt.name,
            alt.reasonEn || "",
            alt.reasonCn || "",
            toy.toyName,
            toy.toyNameCn || "",
            kitData.kitName,
          ].join(" "),
        });
      }
    }
  }

  // ── Blog posts ────────────────────────────────────────────────────────────
  for (const post of blogPostsData) {
    indexEntries.push({
      id: `blog:${post.slug}`,
      type: "blog",
      title: post.title,
      titleEn: post.titleEn,
      subtitle: post.excerpt.slice(0, 80) + "…",
      subtitleEn: post.excerptEn.slice(0, 80) + "…",
      url: `/blog/${post.slug}/`,
      text: [
        post.title,
        post.titleEn,
        post.excerpt,
        post.excerptEn,
        post.content.slice(0, 2000),
        ...(post.tags || []),
        ...(post.tagsEn || []),
      ].join(" "),
    });
  }

  // ── Build FlexSearch Document index ──────────────────────────────────────
  flexIndex = new FlexSearch.Document({
    tokenize: "forward",
    cache: 100,
    document: {
      id: "id",
      index: ["text", "title", "titleEn"],
      store: true,
    },
  });

  for (const entry of indexEntries) {
    flexIndex.add(entry);
  }

  isBuilt = true;
}

/**
 * Search the index and return grouped results.
 */
export function search(query: string, limit = 20): GroupedSearchResults {
  const empty: GroupedSearchResults = { kits: [], alternatives: [], blogs: [], total: 0 };

  if (!flexIndex || !query.trim()) return empty;

  const q = query.trim();

  // Search across all indexed fields
  const rawResults = flexIndex.search(q, {
    limit,
    enrich: true,
  });

  // Collect unique IDs
  const seen = new Set<string>();
  const results: SearchResult[] = [];

  for (const fieldResult of rawResults) {
    for (const item of fieldResult.result) {
      const entry = item.doc as IndexEntry;
      if (!entry || seen.has(entry.id)) continue;
      seen.add(entry.id);

      results.push({
        type: entry.type as SearchResultType,
        id: entry.id,
        title: entry.title,
        titleEn: entry.titleEn,
        subtitle: entry.subtitle,
        subtitleEn: entry.subtitleEn,
        url: entry.url,
      });
    }
  }

  const kits = results.filter((r) => r.type === "kit");
  const alternatives = results.filter((r) => r.type === "alternative");
  const blogs = results.filter((r) => r.type === "blog");

  return {
    kits,
    alternatives,
    blogs,
    total: results.length,
  };
}

/**
 * Reset the index (useful for testing).
 */
export function resetSearchIndex(): void {
  indexEntries = [];
  flexIndex = null;
  isBuilt = false;
}
