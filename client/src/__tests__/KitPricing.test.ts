/**
 * Tests for the verified official pricing model (re-verified 2026-11-11
 * against lovevery.com PDPs after the fall 2026 price increase):
 * every kit must declare its purchase type honestly —
 * "subscription-only" kits (PDP has no single-box option) must not be
 * presented as having a single-box price.
 */
import { describe, it, expect } from "vitest";
import { kits } from "@/data/kits";

const SUBSCRIPTION_ONLY_88 = ["looker", "charmer", "senser", "inspector", "explorer", "thinker"];
const SUBSCRIPTION_ONLY_132 = ["babbler", "realist"];

describe("kit pricing model (verified 2026-11-11)", () => {
  it("covers all 22 kits", () => {
    expect(kits).toHaveLength(22);
  });

  it("every kit declares a purchaseType", () => {
    for (const kit of kits) {
      expect(["single", "subscription-only"]).toContain(kit.purchaseType);
    }
  });

  it("subscription-only kits: $88 for 0–12 month kits", () => {
    for (const id of SUBSCRIPTION_ONLY_88) {
      const kit = kits.find((k) => k.id === id)!;
      expect(kit.purchaseType).toBe("subscription-only");
      expect(kit.price).toBe(88);
      expect(kit.subscriptionPrice).toBeUndefined();
    }
  });

  it("subscription-only kits: $132 for babbler/realist", () => {
    for (const id of SUBSCRIPTION_ONLY_132) {
      const kit = kits.find((k) => k.id === id)!;
      expect(kit.purchaseType).toBe("subscription-only");
      expect(kit.price).toBe(132);
      expect(kit.subscriptionPrice).toBeUndefined();
    }
  });

  it("single-purchase kits: $156 single, $132 subscription", () => {
    const single = kits.filter((k) => k.purchaseType === "single");
    expect(single).toHaveLength(14);
    for (const kit of single) {
      expect(kit.price).toBe(156);
      expect(kit.subscriptionPrice).toBe(132);
    }
  });

  it("no kit claims a priceDropFrom on corrected prices", () => {
    // The $144→$120 "price drop" was a misread of subscription pricing — never show it as a drop.
    for (const kit of kits) {
      expect(kit.priceDropFrom ?? 0).toBeLessThanOrEqual(kit.price);
    }
  });

  it("toy counts match the official PDP lists (verified 2026-11-11; counts include discontinued entries kept in data)", () => {
    const expected: Record<string, number> = {
      looker: 13, charmer: 12, senser: 9, inspector: 10, explorer: 10,
      thinker: 9, babbler: 10, adventurer: 9, realist: 8, companion: 9,
      helper: 8, enthusiast: 7, researcher: 8, freeSpirit: 8, observer: 9,
      storyteller: 8, problemSolver: 9, analyst: 9, connector: 8,
      examiner: 8, persister: 8, planner: 7,
    };
    for (const kit of kits) {
      expect(kit.toys).toHaveLength(expected[kit.id]);
    }
  });

  it("every kit includes its Play Guide booklet", () => {
    for (const kit of kits) {
      const guide = kit.toys.find((t) => t.englishName.startsWith("Play Guide"));
      expect(guide, `${kit.id} missing Play Guide`).toBeDefined();
    }
  });
});
