/**
 * useSwipeNavigation — Mobile touch gesture hook for Kit detail pages.
 *
 * Detects horizontal swipe gestures and triggers navigation callbacks.
 * - Swipe left → navigate to next kit
 * - Swipe right → navigate to previous kit
 *
 * Features:
 * - Minimum swipe distance threshold to avoid accidental triggers
 * - Maximum vertical movement to distinguish from scrolling
 * - Passive event listeners for performance
 * - Cleanup on unmount
 */

import { useEffect, useRef, useCallback } from "react";

export interface SwipeNavigationOptions {
  /** Minimum horizontal distance (px) to register as a swipe. Default: 60 */
  minSwipeDistance?: number;
  /** Maximum vertical distance (px) allowed during swipe. Default: 80 */
  maxVerticalDistance?: number;
  /** Called when user swipes left (next) */
  onSwipeLeft?: () => void;
  /** Called when user swipes right (previous) */
  onSwipeRight?: () => void;
  /** Whether gesture detection is enabled. Default: true */
  enabled?: boolean;
}

export interface SwipeNavigationResult {
  /** Ref to attach to the swipeable element */
  ref: React.RefObject<HTMLElement | null>;
}

export function useSwipeNavigation({
  minSwipeDistance = 60,
  maxVerticalDistance = 80,
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
}: SwipeNavigationOptions): SwipeNavigationResult {
  const ref = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  }, [enabled]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);

    // Reset
    touchStartX.current = null;
    touchStartY.current = null;

    // Ignore if too much vertical movement (user is scrolling)
    if (deltaY > maxVerticalDistance) return;

    // Check horizontal threshold
    if (Math.abs(deltaX) < minSwipeDistance) return;

    if (deltaX < 0) {
      // Swiped left → go to next
      onSwipeLeft?.();
    } else {
      // Swiped right → go to previous
      onSwipeRight?.();
    }
  }, [enabled, minSwipeDistance, maxVerticalDistance, onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchEnd]);

  return { ref };
}
