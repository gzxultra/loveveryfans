/**
 * Tests for AdjacentKitsSection — getAdjacentKits utility function.
 */

import { describe, it, expect } from "vitest";
import { getAdjacentKits } from "@/components/AdjacentKitsSection";
import { kits } from "@/data/kits";

describe("getAdjacentKits", () => {
  it("returns empty arrays for unknown kit ID", () => {
    const result = getAdjacentKits("nonexistent-kit");
    expect(result.before).toHaveLength(0);
    expect(result.after).toHaveLength(0);
  });

  it("returns only after kits for the first kit", () => {
    const firstKit = kits[0];
    const result = getAdjacentKits(firstKit.id, 2);
    expect(result.before).toHaveLength(0);
    expect(result.after.length).toBeGreaterThan(0);
    expect(result.after.length).toBeLessThanOrEqual(2);
  });

  it("returns only before kits for the last kit", () => {
    const lastKit = kits[kits.length - 1];
    const result = getAdjacentKits(lastKit.id, 2);
    expect(result.after).toHaveLength(0);
    expect(result.before.length).toBeGreaterThan(0);
    expect(result.before.length).toBeLessThanOrEqual(2);
  });

  it("returns both before and after kits for a middle kit", () => {
    // Use a kit that is not first or last
    const middleKit = kits[Math.floor(kits.length / 2)];
    const result = getAdjacentKits(middleKit.id, 2);
    expect(result.before.length).toBeGreaterThan(0);
    expect(result.after.length).toBeGreaterThan(0);
  });

  it("does not include the current kit in results", () => {
    const kit = kits[5];
    const result = getAdjacentKits(kit.id, 2);
    const allAdjacent = [...result.before, ...result.after];
    expect(allAdjacent.every((k) => k.id !== kit.id)).toBe(true);
  });

  it("respects the count parameter", () => {
    const middleKit = kits[Math.floor(kits.length / 2)];
    const result1 = getAdjacentKits(middleKit.id, 1);
    const result2 = getAdjacentKits(middleKit.id, 3);
    expect(result1.before.length).toBeLessThanOrEqual(1);
    expect(result1.after.length).toBeLessThanOrEqual(1);
    expect(result2.before.length).toBeLessThanOrEqual(3);
    expect(result2.after.length).toBeLessThanOrEqual(3);
  });

  it("before kits are in order (immediately preceding)", () => {
    const kit = kits[5];
    const result = getAdjacentKits(kit.id, 2);
    const idx = kits.findIndex((k) => k.id === kit.id);
    // before[0] should be kits[idx-2], before[1] should be kits[idx-1]
    if (result.before.length === 2) {
      expect(result.before[0].id).toBe(kits[idx - 2].id);
      expect(result.before[1].id).toBe(kits[idx - 1].id);
    }
  });

  it("after kits are in order (immediately following)", () => {
    const kit = kits[5];
    const result = getAdjacentKits(kit.id, 2);
    const idx = kits.findIndex((k) => k.id === kit.id);
    // after[0] should be kits[idx+1], after[1] should be kits[idx+2]
    if (result.after.length === 2) {
      expect(result.after[0].id).toBe(kits[idx + 1].id);
      expect(result.after[1].id).toBe(kits[idx + 2].id);
    }
  });

  it("total adjacent kits is at most 2*count", () => {
    const middleKit = kits[Math.floor(kits.length / 2)];
    const count = 2;
    const result = getAdjacentKits(middleKit.id, count);
    expect(result.before.length + result.after.length).toBeLessThanOrEqual(count * 2);
  });
});
