import React from "react";
import cn from "./cn";

/**
 * Original line-and-block artwork, drawn in the brand palette.
 *
 * Inline SVG rather than raster files or a CDN: the app ships as an Electron
 * desktop build and a Capacitor mobile build that both have to render with no
 * network, it stays crisp at any density, and it costs a few kB instead of a
 * few hundred. Stock photography of a library would also date the product and
 * clash with the tuned green — this is built from the same tokens.
 */

const C = {
  ink: "#133C2F",
  deep: "#164A38",
  brand: "#1F7454",
  mid: "#2F8A66",
  sage: "#83C2A3",
  mist: "#D7ECE0",
  paper: "#FAFAF8",
  amber: "#C9822A",
  sand: "#F3D49F",
  clay: "#A73B34",
  slate: "#2B5B8F",
  sky: "#B2CDE9",
};

/**
 * The reading-room scene used on the sign-in screen.
 *
 * Composition is deliberately off-centre — the arch and shelving sit right of
 * the midline with the table anchoring the lower left — so the panel reads as
 * a photograph of a room rather than a centred icon.
 */
export const LibraryScene: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 800 640"
    className={cn("h-full w-full", className)}
    role="img"
    aria-label="Illustration of a library reading room"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="lw-room" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0%" stopColor={C.deep} />
        <stop offset="100%" stopColor={C.ink} />
      </linearGradient>
      <linearGradient id="lw-window" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor={C.sage} stopOpacity="0.9" />
        <stop offset="100%" stopColor={C.mid} stopOpacity="0.25" />
      </linearGradient>
      <linearGradient id="lw-beam" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0%" stopColor={C.mist} stopOpacity="0.22" />
        <stop offset="100%" stopColor={C.mist} stopOpacity="0" />
      </linearGradient>
      <clipPath id="lw-arch">
        <path d="M455 150a95 95 0 0 1 190 0v250H455Z" />
      </clipPath>
    </defs>

    <rect width="800" height="640" fill="url(#lw-room)" />

    {/* Arched window, and the light it throws across the floor */}
    <g clipPath="url(#lw-arch)">
      <rect x="455" y="55" width="190" height="345" fill="url(#lw-window)" />
      <g stroke={C.ink} strokeWidth="5" opacity="0.55">
        <path d="M550 55v345M455 200h190M455 290h190" />
      </g>
    </g>
    <path
      d="M455 150a95 95 0 0 1 190 0v250H455Z"
      fill="none"
      stroke={C.mist}
      strokeWidth="4"
      opacity="0.5"
    />
    <path d="M455 400 330 560h300l15-160Z" fill="url(#lw-beam)" />

    {/* Shelving, right */}
    <g>
      <rect x="640" y="120" width="132" height="400" rx="6" fill={C.ink} opacity="0.75" />
      {[168, 258, 348, 438].map((y) => (
        <rect key={y} x="640" y={y} width="132" height="7" rx="3.5" fill={C.mid} opacity="0.5" />
      ))}
      {/* Row of spines per shelf */}
      {[
        { y: 120, books: [[10, 48, C.sage], [62, 48, C.sand], [108, 48, C.mist], [148, 48, C.mid]] },
        { y: 210, books: [[10, 48, C.amber], [58, 48, C.mist], [104, 48, C.sage], [150, 48, C.sky]] },
        { y: 300, books: [[10, 48, C.mist], [56, 48, C.clay], [100, 48, C.sage], [146, 48, C.sand]] },
        { y: 390, books: [[10, 48, C.sky], [52, 48, C.mist], [96, 48, C.mid], [140, 48, C.sage]] },
      ].map((shelf, si) =>
        shelf.books.map(([dx, h, fill], bi) => (
          <rect
            key={`${si}-${bi}`}
            x={652 + (dx as number) * 0.62}
            y={(shelf.y as number) + 48 - (h as number)}
            width={dx === 10 ? 17 : 15}
            height={h as number}
            rx="2"
            fill={fill as string}
            opacity={0.85}
          />
        ))
      )}
    </g>

    {/* Reading table, left */}
    <g>
      <rect x="70" y="415" width="300" height="14" rx="7" fill={C.mid} />
      <rect x="100" y="429" width="12" height="120" rx="6" fill={C.deep} />
      <rect x="328" y="429" width="12" height="120" rx="6" fill={C.deep} />

      {/* Open book on the table */}
      <path d="M150 415l60-22 62 22-62 12Z" fill={C.paper} opacity="0.95" />
      <path d="M150 415l60-22v34l-60 3Z" fill={C.mist} />
      <path d="M210 393l62 22v12l-62-12Z" fill={C.paper} />
      <g stroke={C.mid} strokeWidth="2" opacity="0.5">
        <path d="M166 405h34M166 411h30M224 406h32M224 412h28" />
      </g>

      {/* Stack of three, resting closed */}
      <rect x="276" y="395" width="74" height="9" rx="3" fill={C.amber} />
      <rect x="282" y="385" width="66" height="9" rx="3" fill={C.sage} />
      <rect x="288" y="375" width="58" height="9" rx="3" fill={C.sky} />

      {/* Desk lamp */}
      <path
        d="M104 415v-58a26 26 0 0 1 26-26h6"
        fill="none"
        stroke={C.sage}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M118 322h44l14 30h-72Z" fill={C.sand} />
      <circle cx="140" cy="360" r="6" fill={C.mist} opacity="0.85" />
    </g>

    {/* Floor line */}
    <path d="M0 549h800" stroke={C.mid} strokeWidth="3" opacity="0.35" />

    {/* Plant, foreground left */}
    <g>
      <path d="M32 549v-52" stroke={C.mid} strokeWidth="5" strokeLinecap="round" />
      <path
        d="M32 512c-24-6-34-26-30-46 20 2 33 18 30 46ZM32 522c22-8 30-28 25-47-19 4-30 21-25 47Z"
        fill={C.sage}
        opacity="0.9"
      />
      <path d="M14 549h36l-5 40H19Z" fill={C.clay} opacity="0.85" />
    </g>

    {/* Wall rule, ties the two halves together */}
    <path d="M0 96h330" stroke={C.mid} strokeWidth="3" opacity="0.3" />
    <circle cx="352" cy="96" r="5" fill={C.sage} opacity="0.7" />
  </svg>
);

/**
 * Compact stacked-books mark for empty shelves, splash and 404-style states.
 */
export const BookStackMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 160 160"
    className={cn("h-full w-full", className)}
    role="img"
    aria-label="Illustration of a stack of books"
  >
    <g transform="translate(14 22)">
      <rect x="8" y="94" width="116" height="20" rx="5" fill={C.brand} />
      <rect x="16" y="72" width="100" height="20" rx="5" fill={C.mid} />
      <rect x="4" y="50" width="112" height="20" rx="5" fill={C.sage} />
      <g opacity="0.45" fill={C.paper}>
        <rect x="16" y="100" width="22" height="8" rx="4" />
        <rect x="24" y="78" width="22" height="8" rx="4" />
        <rect x="12" y="56" width="22" height="8" rx="4" />
      </g>
      {/* One volume standing, leaning against the stack */}
      <path d="M124 114V34l18 6v74Z" fill={C.amber} />
      <path d="M124 34l18 6" stroke={C.sand} strokeWidth="3" />
    </g>
  </svg>
);

/**
 * Decorative band for page headers that need a little weight — a repeating
 * row of spines, faded out. Purely ornamental, hidden from assistive tech.
 */
export const ShelfBand: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 480 80"
    preserveAspectRatio="none"
    className={cn("h-full w-full", className)}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="lw-band-fade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#fff" stopOpacity="0" />
        <stop offset="55%" stopColor="#fff" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#fff" stopOpacity="1" />
      </linearGradient>
      <mask id="lw-band-mask">
        <rect width="480" height="80" fill="url(#lw-band-fade)" />
      </mask>
    </defs>
    <g mask="url(#lw-band-mask)" opacity="0.5">
      {Array.from({ length: 24 }).map((_, i) => {
        const h = 34 + ((i * 37) % 38);
        const w = 11 + ((i * 13) % 9);
        const fill = [C.sage, C.mist, C.sand, C.sky, C.mid][i % 5];
        return (
          <rect
            key={i}
            x={i * 20 + 4}
            y={72 - h}
            width={w}
            height={h}
            rx="2"
            fill={fill}
          />
        );
      })}
      <rect y="72" width="480" height="4" rx="2" fill={C.mid} />
    </g>
  </svg>
);

export default LibraryScene;
