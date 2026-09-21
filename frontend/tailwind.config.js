/** @type {import('tailwindcss').Config} */

// ─────────────────────────────────────────────────────────────────────────────
//  Libroware design tokens
//
//  The palettes below deliberately *override* Tailwind's stock ramps rather
//  than sitting beside them. Every component in the app already writes
//  `emerald-600`, `gray-200`, `red-500`… so redefining those ramps re-skins the
//  whole product from one place, with no churn in the JSX and no risk of two
//  competing greens drifting apart.
//
//  · emerald — the brand. Same hue family as before, pulled a few points off
//    full saturation so large fills (nav, buttons, table headers) read as a
//    settled forest green instead of a neon highlighter.
//  · gray    — neutrals carry a faint warm cast. Warm neutrals next to a cool
//    green is what makes a UI feel soft rather than clinical.
//  · amber / red / blue — semantic only (pending, overdue, informational).
//    Desaturated to the same degree as the brand so nothing shouts.
// ─────────────────────────────────────────────────────────────────────────────

const brand = {
  50: "#EEF7F2",
  100: "#D7ECE0",
  200: "#B0D9C4",
  300: "#83C2A3",
  400: "#55A682",
  500: "#2F8A66",
  600: "#1F7454",
  700: "#195C44",
  800: "#164A38",
  900: "#133C2F",
  950: "#08211A",
};

const neutral = {
  50: "#FAFAF8",
  100: "#F4F4F1",
  200: "#E8E8E3",
  300: "#D6D6D0",
  400: "#A8A8A0",
  500: "#7B7B73",
  600: "#5C5C55",
  700: "#45453F",
  800: "#2C2C28",
  900: "#1C1C19",
  950: "#121210",
};

const amber = {
  50: "#FDF6EC",
  100: "#FAE9CE",
  200: "#F3D49F",
  300: "#E9B968",
  400: "#DD9E3D",
  500: "#C9822A",
  600: "#A96620",
  700: "#85501C",
  800: "#6A4019",
  900: "#563517",
  950: "#2E1C0C",
};

const red = {
  50: "#FDF1F0",
  100: "#FADEDC",
  200: "#F3BDB9",
  300: "#E8948E",
  400: "#D96A63",
  500: "#C44E46",
  600: "#A73B34",
  700: "#862F2A",
  800: "#6B2724",
  900: "#582320",
  950: "#2F110F",
};

const blue = {
  50: "#EEF4FA",
  100: "#D8E7F5",
  200: "#B2CDE9",
  300: "#85AFD8",
  400: "#598FC4",
  500: "#3A72AC",
  600: "#2B5B8F",
  700: "#244972",
  800: "#1F3C5C",
  900: "#1B334D",
  950: "#0E1C2B",
};

const purple = {
  50: "#F3F1F9",
  100: "#E4E0F2",
  200: "#C9C1E5",
  300: "#A79BD3",
  400: "#8573BD",
  500: "#6A57A3",
  600: "#554485",
  700: "#45376B",
  800: "#392E57",
  900: "#302848",
  950: "#191427",
};

// Shadows are tinted with the darkest brand green rather than pure black.
// Neutral-black shadows on a warm surface read as grime; a tinted shadow reads
// as light falling through the room the interface lives in.
const tint = "24, 38, 32";

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        emerald: brand,
        brand,
        gray: neutral,
        neutral,
        stone: neutral,
        slate: neutral,
        zinc: neutral,
        amber: amber,
        yellow: amber,
        red: red,
        rose: red,
        blue: blue,
        sky: blue,
        indigo: blue,
        purple: purple,
        violet: purple,
        fuchsia: purple,
        green: brand,
        teal: brand,
        cyan: blue,
      },

      fontFamily: {
        // Satoshi carries the UI at small sizes; Clash Grotesk keeps the
        // display voice the product already had.
        sans: ["Satoshi", "Clash Grotesk", "system-ui", "sans-serif"],
        display: ["Clash Grotesk", "Satoshi", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },

      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.01em" }],
      },

      letterSpacing: {
        tighter: "-0.03em",
        tight: "-0.018em",
        snug: "-0.01em",
      },

      // Softer than stock Tailwind at every step. `rounded-md` and `rounded-lg`
      // are the two most-used radii in the codebase, so most of the softening
      // lands automatically.
      borderRadius: {
        sm: "0.375rem",
        DEFAULT: "0.5rem",
        md: "0.625rem",
        lg: "0.875rem",
        xl: "1.125rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },

      boxShadow: {
        xs: `0 1px 2px rgba(${tint}, 0.05)`,
        sm: `0 1px 2px rgba(${tint}, 0.05), 0 1px 3px rgba(${tint}, 0.04)`,
        DEFAULT: `0 1px 2px rgba(${tint}, 0.04), 0 2px 6px rgba(${tint}, 0.05)`,
        md: `0 2px 4px rgba(${tint}, 0.04), 0 6px 16px rgba(${tint}, 0.07)`,
        lg: `0 4px 8px rgba(${tint}, 0.04), 0 12px 28px rgba(${tint}, 0.08)`,
        xl: `0 8px 16px rgba(${tint}, 0.05), 0 24px 48px rgba(${tint}, 0.1)`,
        "2xl": `0 16px 32px rgba(${tint}, 0.08), 0 40px 80px rgba(${tint}, 0.14)`,
        raised: `0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 2px rgba(${tint}, 0.06), 0 4px 12px rgba(${tint}, 0.06)`,
        none: "none",
      },

      transitionTimingFunction: {
        spring: "cubic-bezier(0.32, 0.72, 0, 1)",
        soft: "cubic-bezier(0.4, 0.14, 0.3, 1)",
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
      },

      transitionDuration: {
        250: "250ms",
        400: "400ms",
      },

      // A single named scale for every stacked surface. Replaces the ad-hoc
      // z-[100] / z-[9999] values scattered through the app.
      zIndex: {
        base: "0",
        raised: "10",
        sticky: "20",
        nav: "40",
        drawer: "50",
        backdrop: "60",
        modal: "70",
        toast: "80",
        splash: "90",
      },

      maxWidth: {
        prose: "68ch",
        shell: "90rem",
      },

      screens: {
        xs: "420px",
      },

      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translate3d(0, 10px, 0)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.97) translate3d(0,6px,0)" },
          to: { opacity: "1", transform: "scale(1) translate3d(0,0,0)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translate3d(16px, 0, 0)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        slideInLeft: {
          from: { opacity: "0", transform: "translate3d(-16px, 0, 0)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translate3d(0, -8px, 0)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },

      animation: {
        "fade-in": "fadeIn 220ms cubic-bezier(0.4, 0.14, 0.3, 1) both",
        "fade-up": "fadeUp 420ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scaleIn 260ms cubic-bezier(0.32, 0.72, 0, 1) both",
        "slide-in-right": "slideInRight 320ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in-left": "slideInLeft 320ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-down": "slideDown 240ms cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.6s infinite",
        breathe: "breathe 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
