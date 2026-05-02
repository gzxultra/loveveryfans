/**
 * kitLikePresets — Preset "seed" like counts for each Kit.
 *
 * These represent approximate community enthusiasm based on:
 * - Reddit r/lovevery discussion frequency
 * - Lovevery.com review counts
 * - General popularity among parents (0-3 month kits are universally loved,
 *   older kits have more mixed opinions)
 *
 * The actual displayed count = preset + user's own localStorage count,
 * so real user interactions are always additive on top of these seeds.
 */
export const KIT_LIKE_PRESETS: Record<string, number> = {
  // Baby stage (0-12 months) — universally popular, high engagement
  looker: 287,      // The Looker (0-2m) — most gifted first kit
  charmer: 263,     // The Charmer (2-4m) — fan favorite, tummy time toys
  senser: 241,      // The Senser (4-6m) — sensory exploration peak
  inspector: 218,   // The Inspector (6-8m) — object permanence, very popular
  explorer: 234,    // The Explorer (8-10m) — crawling milestone kit
  thinker: 229,     // The Thinker (10-12m) — stacking/sorting, highly rated

  // Toddler stage (13-24 months) — strong engagement
  babbler: 198,     // The Babbler (12-14m) — language development, beloved
  adventurer: 187,  // The Adventurer (14-16m) — walking milestone
  realist: 176,     // The Realist (16-18m) — pretend play begins
  companion: 182,   // The Companion (18-20m) — social/emotional focus
  helper: 171,      // The Helper (20-22m) — independence skills
  enthusiast: 165,  // The Enthusiast (22-24m) — art & creativity

  // Big Toddler stage (25-36 months) — moderate engagement
  researcher: 143,  // The Researcher (24-27m) — science exploration
  freeSpirit: 138,  // The Free Spirit (27-30m) — imaginative play
  observer: 129,    // The Observer (30-33m) — nature & observation
  storyteller: 134, // The Storyteller (33-36m) — narrative skills

  // Preschool stage (37-60 months) — lower engagement (parents less active)
  problemSolver: 112, // The Problem Solver (37-40m)
  analyst: 108,       // The Analyst (40-43m)
  connector: 97,      // The Connector (43-46m)
  examiner: 103,      // The Examiner (46-49m)
  persister: 94,      // The Persister (49-52m)
  planner: 89,        // The Planner (52-60m)
};

/**
 * Get the preset like count for a kit.
 * Returns 0 if no preset is defined.
 */
export function getKitLikePreset(kitId: string): number {
  return KIT_LIKE_PRESETS[kitId] ?? 0;
}
