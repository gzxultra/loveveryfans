/**
 * useFavorites — localStorage-backed kit favorites/likes system.
 *
 * Stores a set of kit IDs the user has "liked" in localStorage.
 * Also maintains a per-user like count per kit in localStorage.
 *
 * Design principles:
 * - No fake seed data: counts start at 0 and only grow when real users like
 * - Counts are stored per-browser (no backend), but reflect genuine user actions
 * - Cross-tab sync via the storage event
 * - Keys are versioned (v2) to avoid conflicts with old seeded data
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { trackEvent } from "@/lib/analytics";

const FAVORITES_KEY = "lovevery-favorites-v2";
const LIKE_COUNTS_KEY = "lovevery-like-counts-v2";

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set<string>(arr as string[]);
    }
  } catch {
    // ignore parse errors
  }
  return new Set<string>();
}

function saveFavorites(favs: Set<string>) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favs)));
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
}

function loadLikeCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LIKE_COUNTS_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      if (typeof obj === "object" && obj !== null) return obj as Record<string, number>;
    }
  } catch {
    // ignore
  }
  return {};
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
        const next = new Set<string>(prev);
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
          const current = newCounts[kitId] ?? 0;
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
    (kitId: string) => likeCounts[kitId] ?? 0,
    [likeCounts]
  );

  const favoritesList = useMemo(() => Array.from(favorites), [favorites]);

  return {
    favorites: favoritesList,
    isFavorite,
    toggleFavorite,
    getLikeCount,
    favoritesCount: favorites.size,
  };
}
