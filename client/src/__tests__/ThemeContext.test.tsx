/**
 * Tests for ThemeContext: the dark-mode toggle really flips the .dark class
 * on documentElement, which drives the .dark variable overrides in index.css.
 * (P1-2: ThemeProvider was previously never mounted.)
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";

function ToggleProbe() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button data-testid="toggle" onClick={() => toggleTheme?.()}>
      {theme}
    </button>
  );
}

describe("ThemeContext", () => {
  beforeEach(() => {
    // setup.ts defines localStorage as vi.fn()s but vitest mockReset wipes
    // their implementations before each test; restore a working store here.
    const store: Record<string, string> = {};
    vi.mocked(localStorage.getItem).mockImplementation(
      (key: string) => store[key] ?? null
    );
    vi.mocked(localStorage.setItem).mockImplementation(
      (key: string, value: string) => {
        store[key] = value;
      }
    );
    vi.mocked(localStorage.removeItem).mockImplementation((key: string) => {
      delete store[key];
    });
    vi.mocked(localStorage.clear).mockImplementation(() => {
      for (const key of Object.keys(store)) delete store[key];
    });
    document.documentElement.classList.remove("dark");
  });

  it("starts in light mode without .dark class", () => {
    render(
      <ThemeProvider switchable>
        <ToggleProbe />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(screen.getByTestId("toggle")).toHaveTextContent("light");
  });

  it("toggleTheme flips the .dark class and persists to localStorage", () => {
    render(
      <ThemeProvider switchable>
        <ToggleProbe />
      </ThemeProvider>
    );
    act(() => {
      screen.getByTestId("toggle").click();
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
    act(() => {
      screen.getByTestId("toggle").click();
    });
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("restores persisted theme on mount", () => {
    localStorage.setItem("theme", "dark");
    render(
      <ThemeProvider switchable>
        <ToggleProbe />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByTestId("toggle")).toHaveTextContent("dark");
  });

  it("defaultTheme=dark applies .dark without switchable", () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ToggleProbe />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
