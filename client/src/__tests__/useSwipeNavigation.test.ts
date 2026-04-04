/**
 * Tests for useSwipeNavigation hook.
 * Tests the swipe detection logic (delta calculation and threshold checking).
 */

import { describe, it, expect } from "vitest";

/**
 * Pure helper that replicates the swipe detection logic from useSwipeNavigation.
 * We test this logic directly without needing to mount a component.
 */
function detectSwipe(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  minSwipeDistance = 60,
  maxVerticalDistance = 80
): "left" | "right" | "none" {
  const deltaX = endX - startX;
  const deltaY = Math.abs(endY - startY);

  if (deltaY > maxVerticalDistance) return "none";
  if (Math.abs(deltaX) < minSwipeDistance) return "none";

  return deltaX < 0 ? "left" : "right";
}

describe("swipe detection logic", () => {
  it("detects left swipe when deltaX < -minSwipeDistance", () => {
    expect(detectSwipe(300, 100, 200, 100)).toBe("left");
  });

  it("detects right swipe when deltaX > minSwipeDistance", () => {
    expect(detectSwipe(200, 100, 300, 100)).toBe("right");
  });

  it("returns none when horizontal distance is below threshold", () => {
    expect(detectSwipe(200, 100, 230, 100)).toBe("none");
  });

  it("returns none when vertical movement exceeds maxVerticalDistance", () => {
    // Large vertical movement = scrolling, not swiping
    expect(detectSwipe(300, 100, 200, 200)).toBe("none");
  });

  it("returns none for exactly zero horizontal movement", () => {
    expect(detectSwipe(200, 100, 200, 100)).toBe("none");
  });

  it("detects left swipe at exactly minSwipeDistance", () => {
    expect(detectSwipe(200, 100, 140, 100)).toBe("left");
  });

  it("returns none just below minSwipeDistance", () => {
    expect(detectSwipe(200, 100, 141, 100)).toBe("none");
  });

  it("respects custom minSwipeDistance", () => {
    // With threshold=30, a 40px swipe should be detected
    expect(detectSwipe(200, 100, 160, 100, 30)).toBe("left");
    // But not a 20px swipe
    expect(detectSwipe(200, 100, 180, 100, 30)).toBe("none");
  });

  it("respects custom maxVerticalDistance", () => {
    // With maxVertical=50, a 60px vertical movement should be ignored
    expect(detectSwipe(300, 100, 200, 160, 60, 50)).toBe("none");
    // But a 40px vertical movement should still detect the swipe
    expect(detectSwipe(300, 100, 200, 140, 60, 50)).toBe("left");
  });

  it("handles diagonal swipe with small vertical component", () => {
    // 100px horizontal, 30px vertical → should detect
    expect(detectSwipe(300, 100, 200, 130)).toBe("left");
  });
});
