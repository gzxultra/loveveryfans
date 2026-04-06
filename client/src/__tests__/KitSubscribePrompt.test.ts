/**
 * Tests for KitSubscribePrompt component
 *
 * Tests the exported EMAIL_REGEX and i18n integration.
 */

import { describe, it, expect } from "vitest";
import { EMAIL_REGEX } from "@/components/KitSubscribePrompt";
import { i18n } from "@/data/i18n";

// ---------------------------------------------------------------------------
// EMAIL_REGEX
// ---------------------------------------------------------------------------

describe("KitSubscribePrompt EMAIL_REGEX", () => {
  it("matches a valid email", () => {
    expect(EMAIL_REGEX.test("parent@example.com")).toBe(true);
  });

  it("matches email with plus addressing", () => {
    expect(EMAIL_REGEX.test("parent+lovevery@example.com")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(EMAIL_REGEX.test("")).toBe(false);
  });

  it("rejects string without @", () => {
    expect(EMAIL_REGEX.test("parentexample.com")).toBe(false);
  });

  it("rejects string without domain", () => {
    expect(EMAIL_REGEX.test("parent@")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// i18n keys exist
// ---------------------------------------------------------------------------

describe("KitSubscribePrompt i18n keys", () => {
  it("has hint text in both languages", () => {
    expect(i18n.kitSubscribePrompt.hint.cn).toBeTruthy();
    expect(i18n.kitSubscribePrompt.hint.en).toBeTruthy();
  });

  it("has cta text in both languages", () => {
    expect(i18n.kitSubscribePrompt.cta.cn).toBeTruthy();
    expect(i18n.kitSubscribePrompt.cta.en).toBeTruthy();
  });

  it("has placeholder text in both languages", () => {
    expect(i18n.kitSubscribePrompt.placeholder.cn).toBeTruthy();
    expect(i18n.kitSubscribePrompt.placeholder.en).toBeTruthy();
  });

  it("has button text in both languages", () => {
    expect(i18n.kitSubscribePrompt.button.cn).toBeTruthy();
    expect(i18n.kitSubscribePrompt.button.en).toBeTruthy();
  });

  it("has success text in both languages", () => {
    expect(i18n.kitSubscribePrompt.success.cn).toBeTruthy();
    expect(i18n.kitSubscribePrompt.success.en).toBeTruthy();
  });

  it("has error text in both languages", () => {
    expect(i18n.kitSubscribePrompt.error.cn).toBeTruthy();
    expect(i18n.kitSubscribePrompt.error.en).toBeTruthy();
  });

  it("has invalidEmail text in both languages", () => {
    expect(i18n.kitSubscribePrompt.invalidEmail.cn).toBeTruthy();
    expect(i18n.kitSubscribePrompt.invalidEmail.en).toBeTruthy();
  });

  it("has subscribing text in both languages", () => {
    expect(i18n.kitSubscribePrompt.subscribing.cn).toBeTruthy();
    expect(i18n.kitSubscribePrompt.subscribing.en).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// FloatingBar i18n keys exist
// ---------------------------------------------------------------------------

describe("FloatingBar i18n keys", () => {
  it("has text in both languages", () => {
    expect(i18n.floatingBar.text.cn).toBeTruthy();
    expect(i18n.floatingBar.text.en).toBeTruthy();
  });

  it("has button text in both languages", () => {
    expect(i18n.floatingBar.button.cn).toBeTruthy();
    expect(i18n.floatingBar.button.en).toBeTruthy();
  });

  it("has success text in both languages", () => {
    expect(i18n.floatingBar.success.cn).toBeTruthy();
    expect(i18n.floatingBar.success.en).toBeTruthy();
  });

  it("has placeholder text in both languages", () => {
    expect(i18n.floatingBar.placeholder.cn).toBeTruthy();
    expect(i18n.floatingBar.placeholder.en).toBeTruthy();
  });

  it("has close text in both languages", () => {
    expect(i18n.floatingBar.close.cn).toBeTruthy();
    expect(i18n.floatingBar.close.en).toBeTruthy();
  });

  it("has subscribing text in both languages", () => {
    expect(i18n.floatingBar.subscribing.cn).toBeTruthy();
    expect(i18n.floatingBar.subscribing.en).toBeTruthy();
  });

  it("has invalidEmail text in both languages", () => {
    expect(i18n.floatingBar.invalidEmail.cn).toBeTruthy();
    expect(i18n.floatingBar.invalidEmail.en).toBeTruthy();
  });

  it("has error text in both languages", () => {
    expect(i18n.floatingBar.error.cn).toBeTruthy();
    expect(i18n.floatingBar.error.en).toBeTruthy();
  });
});
