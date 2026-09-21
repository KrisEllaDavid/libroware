import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

/**
 * Chart chrome, resolved for the active theme.
 *
 * Recharts needs literal colour strings — it can't read Tailwind classes — so
 * the charts used to hardcode `#e5e7eb` for the grid and leave the axes at the
 * library default. In dark mode that produced a near-white grid burning
 * through a near-black card, and axis labels at roughly 1.5:1 contrast.
 *
 * Reading from the CSS custom properties in index.css keeps one definition of
 * the palette for both the components and the charts.
 */

export interface ChartTheme {
  grid: string;
  axis: string;
  tooltip: {
    contentStyle: React.CSSProperties;
    labelStyle: React.CSSProperties;
    itemStyle: React.CSSProperties;
    cursor: { fill: string } | { stroke: string; strokeWidth: number };
  };
  /** Categorical series colours, ordered for maximum separation. */
  series: string[];
  tick: { fontSize: number; fill: string };
}

/** Ordered so adjacent slices in a pie never land on neighbouring hues. */
export const SERIES = [
  "#1F7454", // brand
  "#2B5B8F", // blue
  "#C9822A", // amber
  "#6A57A3", // purple
  "#A73B34", // red
  "#55A682", // light brand
  "#598FC4", // light blue
  "#85501C", // deep amber
];

export const BRAND = "#1F7454";
export const BRAND_LIGHT = "#55A682";
export const BLUE = "#2B5B8F";
export const AMBER = "#C9822A";
export const RED = "#A73B34";
export const PURPLE = "#6A57A3";

const read = (name: string, fallback: string): string => {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
};

export function useChartTheme(): ChartTheme {
  const { theme } = useTheme();
  const [tokens, setTokens] = useState(() => ({
    grid: "#E8E8E3",
    axis: "#7B7B73",
    bg: "#FFFFFF",
    border: "#E8E8E3",
    text: "#2C2C28",
  }));

  // The `.dark` class lands on <html> in an effect, so read after paint.
  useEffect(() => {
    setTokens({
      grid: read("--chart-grid", "#E8E8E3"),
      axis: read("--chart-axis", "#7B7B73"),
      bg: read("--chart-tooltip-bg", "#FFFFFF"),
      border: read("--chart-tooltip-border", "#E8E8E3"),
      text: read("--chart-tooltip-text", "#2C2C28"),
    });
  }, [theme]);

  return {
    grid: tokens.grid,
    axis: tokens.axis,
    tick: { fontSize: 11, fill: tokens.axis },
    series: SERIES,
    tooltip: {
      contentStyle: {
        backgroundColor: tokens.bg,
        border: `1px solid ${tokens.border}`,
        borderRadius: "0.625rem",
        boxShadow: "0 4px 8px rgba(24,38,32,0.04), 0 12px 28px rgba(24,38,32,0.08)",
        fontSize: "0.8125rem",
        padding: "0.5rem 0.75rem",
      },
      labelStyle: {
        color: tokens.text,
        fontWeight: 600,
        marginBottom: "0.25rem",
      },
      itemStyle: { color: tokens.text, padding: 0 },
      cursor: { fill: theme === "dark" ? "#FFFFFF0D" : "#1826200A" },
    },
  };
}
