/**
 * Tests for FloatingSubscribeBar component
 *
 * Tests the exported constants and EMAIL_REGEX.
 */

import { describe, it, expect } from "vitest";
import {
  STORAGE_KEY,
  SCROLL_THRESHOLD_MIN,
  SCROLL_THRESHOLD_MAX,
  EMAIL_REGEX,
} from "@/components/FloatingSubscribeBar";
import { i18n } from "@/data/i18n";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("FloatingSubscribeBar constants", () => {
  it("has a valid storage key", () => {
    expect(STORAGE_KEY).toBe("loveveryfans-floating-bar-dismissed");
  });

  it("scroll threshold min is 0.50", () => {
    expect(SCROLL_THRESHOLD_MIN).toBe(0.50);
  });

  it("scroll threshold max is 0.60", () => {
    expect(SCROLL_THRESHOLD_MAX).toBe(0.60);
  });

  it("scroll threshold min is less than max", () => {
    expect(SCROLL_THRESHOLD_MIN).toBeLessThan(SCROLL_THRESHOLD_MAX);
  });

  it("scroll thresholds are between 0 and 1", () => {
    expect(SCROLL_THRESHOLD_MIN).toBeGreaterThan(0);
    expect(SCROLL_THRESHOLD_MAX).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// EMAIL_REGEX
// ---------------------------------------------------------------------------

describe("FloatingSubscribeBar EMAIL_REGEX", () => {
  it("matches a valid email", () => {
    expect(EMAIL_REGEX.test("user@example.com")).toBe(true);
  });

  it("matches email with subdomain", () => {
    expect(EMAIL_REGEX.test("user@mail.example.com")).toBe(true);
  });

  it("matches email with plus addressing", () => {
    expect(EMAIL_REGEX.test("user+tag@example.com")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(EMAIL_REGEX.test("")).toBe(false);
  });

  it("rejects string without @", () => {
    expect(EMAIL_REGEX.test("userexample.com")).toBe(false);
  });

  it("rejects string with spaces", () => {
    expect(EMAIL_REGEX.test("user @example.com")).toBe(false);
  });

  it("rejects string without domain extension", () => {
    expect(EMAIL_REGEX.test("user@example")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// i18n keys for floating bar
// ---------------------------------------------------------------------------

describe("FloatingSubscribeBar i18n", () => {
  it("has all required keys in both languages", () => {
    const keys = ["text", "button", "subscribing", "success", "placeholder", "close", "invalidEmail", "error"] as const;
    for (const key of keys) {
      expect(i18n.floatingBar[key].cn).toBeTruthy();
      expect(i18n.floatingBar[key].en).toBeTruthy();
    }
  });
});
