/**
 * useFavorites — localStorage-backed kit favorites/likes system.
 *
 * Stores a set of kit IDs the user has "liked" in localStorage.
 * Also maintains a per-user like count per kit in localStorage.
 *
 * Design principles:
 * - Preset seed counts reflect community popularity (from kitLikePresets.ts)
 * - User interactions are additive on top of the preset
 * - Counts are stored per-browser (no backend)
 * - Cross-tab sync via the storage event
 * - Keys are versioned (v2) to avoid conflicts with old data
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { trackEvent } from "@/lib/analytics";
import { getKitLikePreset } from "@/data/kitLikePresets";

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

        // Update like counts (user delta only — preset is added at read time)
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

  /**
   * Returns the total like count = preset seed + user delta.
   * This ensures the displayed number always feels lively even for new visitors.
   */
  const getLikeCount = useCallback(
    (kitId: string) => {
      const userDelta = likeCounts[kitId] ?? 0;
      const preset = getKitLikePreset(kitId);
      return preset + userDelta;
    },
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
