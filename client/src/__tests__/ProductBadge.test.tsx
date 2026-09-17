/**
 * Tests for ProductBadge: new-badge visibility rules (isNew flag / addedAt
 * 90-day window auto-expiry) and price-drop badge rules.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { i18n as rawI18n } from "@/data/i18n";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    lang: "cn",
    t: (cn: string) => cn,
    convert: (s: string) => s,
  }),
}));

vi.mock("@/hooks/useI18n", () => ({
  useI18n: () => rawI18n,
}));

import ProductBadge from "@/components/ProductBadge";

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

afterEach(cleanup);

describe("ProductBadge", () => {
  it("renders nothing when no badge data is provided", () => {
    const { container } = render(<ProductBadge />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the new badge when isNew is true", () => {
    render(<ProductBadge isNew price={80} />);
    expect(screen.getByText("新品")).toBeInTheDocument();
  });

  it("shows the new badge when addedAt is within 90 days", () => {
    render(<ProductBadge addedAt={daysAgo(30)} price={80} />);
    expect(screen.getByText("新品")).toBeInTheDocument();
  });

  it("auto-expires the new badge after 90 days", () => {
    const { container } = render(<ProductBadge addedAt={daysAgo(120)} price={80} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("ignores malformed addedAt dates", () => {
    const { container } = render(<ProductBadge addedAt="not-a-date" price={80} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the price-drop badge when priceDropFrom exceeds current price", () => {
    render(<ProductBadge priceDropFrom={100} price={80} />);
    expect(screen.getByText("降价")).toBeInTheDocument();
  });

  it("parses currency strings for the price-drop comparison", () => {
    render(<ProductBadge priceDropFrom={100} price="$80.00" />);
    expect(screen.getByText("降价")).toBeInTheDocument();
  });

  it("hides the price-drop badge when priceDropFrom is not greater than price", () => {
    const { container } = render(<ProductBadge priceDropFrom={70} price={80} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows both badges together when both apply", () => {
    render(<ProductBadge addedAt={daysAgo(10)} priceDropFrom={100} price={80} />);
    expect(screen.getByText("新品")).toBeInTheDocument();
    expect(screen.getByText("降价")).toBeInTheDocument();
  });

  it("applies className to the wrapper", () => {
    const { container } = render(
      <ProductBadge isNew price={80} className="absolute top-2 left-2" />
    );
    expect(container.firstChild).toHaveClass("absolute");
  });
});
