/**
 * Tests for prefetchRoute utility.
 * Verifies that the function exists and accepts valid route names.
 */

import { describe, it, expect } from "vitest";
import { prefetchRoute } from "@/App";

describe("prefetchRoute", () => {
  it("is a function", () => {
    expect(typeof prefetchRoute).toBe("function");
  });

  it("accepts 'home' without throwing", () => {
    expect(() => prefetchRoute("home")).not.toThrow();
  });

  it("accepts 'kit' without throwing", () => {
    expect(() => prefetchRoute("kit")).not.toThrow();
  });

  it("accepts 'blog' without throwing", () => {
    expect(() => prefetchRoute("blog")).not.toThrow();
  });

  it("accepts 'about' without throwing", () => {
    expect(() => prefetchRoute("about")).not.toThrow();
  });
});
