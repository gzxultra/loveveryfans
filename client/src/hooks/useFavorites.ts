/**
 * useFavorites — localStorage-backed kit favorites/likes system.
 *
 * Stores a set of kit IDs the user has "liked" in localStorage.
 * Also maintains a simulated global like count per kit to give
 * a sense of community engagement (seeded with plausible numbers).
 *
 * The global counts are per-browser only (no backend), but the
 * seed values create a realistic starting point.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { trackEvent } from "@/lib/analytics";

const FAVORITES_KEY = "lovevery-favorites";
const LIKE_COUNTS_KEY = "lovevery-like-counts";

// Seed like counts so the site doesn't look empty on first visit
const SEED_COUNTS: Record<string, number> = {
  looker: 328,
  charmer: 295,
  senser: 276,
  inspector: 312,
  explorer: 341,
  thinker: 289,
  babbler: 267,
  adventurer: 303,
  realist: 254,
  companion: 238,
  helper: 271,
  enthusiast: 245,
  researcher: 229,
  freeSpirit: 218,
  observer: 234,
  storyteller: 261,
  problemSolver: 247,
  analyst: 213,
  connector: 226,
  examiner: 209,
  persister: 197,
  planner: 221,
};

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {
    // ignore
  }
  return new Set();
}

function saveFavorites(favs: Set<string>) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs]));
  } catch {
    // ignore
  }
}

function loadLikeCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LIKE_COUNTS_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      if (typeof obj === "object" && obj !== null) return obj;
    }
  } catch {
    // ignore
  }
  // First visit: seed with initial counts
  const counts = { ...SEED_COUNTS };
  try {
    localStorage.setItem(LIKE_COUNTS_KEY, JSON.stringify(counts));
  } catch {
    // ignore
  }
  return counts;
}

function saveLikeCounts(counts: Record<string, number>) {
  try {
    localStorage.setItem(LIKE_COUNTS_KEY, JSON.stringify(counts));
  } catch {
    // ignore
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => loadLikeCounts());

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === FAVORITES_KEY) {
        setFavorites(loadFavorites());
      }
      if (e.key === LIKE_COUNTS_KEY) {
        setLikeCounts(loadLikeCounts());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const isFavorite = useCallback(
    (kitId: string) => favorites.has(kitId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (kitId: string) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        const wasLiked = next.has(kitId);
        if (wasLiked) {
          next.delete(kitId);
        } else {
          next.add(kitId);
        }
        saveFavorites(next);

        // Update like counts
        setLikeCounts((prevCounts) => {
          const newCounts = { ...prevCounts };
          const current = newCounts[kitId] || SEED_COUNTS[kitId] || 0;
          newCounts[kitId] = wasLiked ? Math.max(0, current - 1) : current + 1;
          saveLikeCounts(newCounts);
          return newCounts;
        });

        // Track analytics
        trackEvent(wasLiked ? "unlike_kit" : "like_kit", {
          kit_id: kitId,
        });

        return next;
      });
    },
    []
  );

  const getLikeCount = useCallback(
    (kitId: string) => likeCounts[kitId] || SEED_COUNTS[kitId] || 0,
    [likeCounts]
  );

  const favoritesList = useMemo(() => [...favorites], [favorites]);

  return {
    favorites: favoritesList,
    isFavorite,
    toggleFavorite,
    getLikeCount,
    favoritesCount: favorites.size,
  };
}
