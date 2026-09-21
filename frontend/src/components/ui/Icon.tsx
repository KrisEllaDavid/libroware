import React from "react";

/**
 * The app's icon set.
 *
 * Hand-drawn on a 24×24 grid at a uniform 1.75 stroke with round caps and
 * joins. Everything previously inlined its own SVG at whatever weight the
 * surrounding paste happened to carry, which is why the toolbars looked
 * uneven — a 2.0-stroke outline icon sitting next to a solid 20×20 glyph.
 */

export type IconName =
  | "book"
  | "books"
  | "bookmark"
  | "users"
  | "user"
  | "userPlus"
  | "tag"
  | "search"
  | "plus"
  | "minus"
  | "close"
  | "check"
  | "checkCircle"
  | "alert"
  | "info"
  | "warning"
  | "clock"
  | "calendar"
  | "chevronDown"
  | "chevronRight"
  | "chevronLeft"
  | "arrowRight"
  | "arrowLeft"
  | "arrowUpRight"
  | "edit"
  | "trash"
  | "restore"
  | "download"
  | "upload"
  | "print"
  | "qr"
  | "scan"
  | "bell"
  | "settings"
  | "logout"
  | "sun"
  | "moon"
  | "globe"
  | "chart"
  | "trend"
  | "coins"
  | "filter"
  | "grid"
  | "list"
  | "history"
  | "shield"
  | "star"
  | "inbox"
  | "refresh"
  | "menu"
  | "eye"
  | "eyeOff"
  | "mail"
  | "lock"
  | "wifiOff"
  | "sparkle";

const PATHS: Record<IconName, React.ReactNode> = {
  book: <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H18a1 1 0 0 1 1 1v12.5M4 5.5V18a2 2 0 0 0 2 2h13M4 5.5C4 6.33 4.67 7 5.5 7H19" />,
  books: (
    <>
      <path d="M12 6.8c-1.2-.9-2.9-1.4-4.6-1.4-1.3 0-2.5.2-3.4.7v12c.9-.5 2.1-.7 3.4-.7 1.7 0 3.4.5 4.6 1.4" />
      <path d="M12 6.8c1.2-.9 2.9-1.4 4.6-1.4 1.3 0 2.5.2 3.4.7v12c-.9-.5-2.1-.7-3.4-.7-1.7 0-3.4.5-4.6 1.4" />
      <path d="M12 6.8v12.6" />
    </>
  ),
  bookmark: <path d="M6.5 4h11a.5.5 0 0 1 .5.5v15.2a.3.3 0 0 1-.47.25L12 16.2l-5.53 3.75A.3.3 0 0 1 6 19.7V4.5a.5.5 0 0 1 .5-.5Z" />,
  users: (
    <>
      <path d="M15.5 20v-1.5a3.5 3.5 0 0 0-3.5-3.5H6a3.5 3.5 0 0 0-3.5 3.5V20" />
      <circle cx="9" cy="8" r="3.2" />
      <path d="M21.5 20v-1.5a3.5 3.5 0 0 0-2.6-3.38M16 4.8a3.2 3.2 0 0 1 0 6.2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.8 20v-1a4 4 0 0 1 4-4h6.4a4 4 0 0 1 4 4v1" />
    </>
  ),
  userPlus: (
    <>
      <circle cx="9.5" cy="8" r="3.4" />
      <path d="M3 20v-1a4 4 0 0 1 4-4h5a4 4 0 0 1 4 4v1M18 8.5v5M20.5 11h-5" />
    </>
  ),
  tag: (
    <>
      <path d="M4 10.7V5a1 1 0 0 1 1-1h5.7a1 1 0 0 1 .7.3l8 8a1 1 0 0 1 0 1.4l-5.7 5.7a1 1 0 0 1-1.4 0l-8-8a1 1 0 0 1-.3-.7Z" />
      <path d="M7.8 7.8h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.4 15.4 4.1 4.1" />
    </>
  ),
  plus: <path d="M12 5.2v13.6M5.2 12h13.6" />,
  minus: <path d="M5.2 12h13.6" />,
  close: <path d="M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8" />,
  check: <path d="m5 12.6 4.6 4.6L19 7.8" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="m8.4 12.2 2.5 2.5 4.7-4.9" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 8v4.6M12 16h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 16v-4.6M12 8.2h.01" />
    </>
  ),
  warning: (
    <>
      <path d="M10.7 4.3 3.2 17.2a1.5 1.5 0 0 0 1.3 2.3h15a1.5 1.5 0 0 0 1.3-2.3L13.3 4.3a1.5 1.5 0 0 0-2.6 0Z" />
      <path d="M12 9.5v4M12 16.5h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.4V12l3 1.8" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.6" y="5.2" width="16.8" height="15.2" rx="2.2" />
      <path d="M3.6 10h16.8M8.4 3.4v3.4M15.6 3.4v3.4" />
    </>
  ),
  chevronDown: <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />,
  chevronRight: <path d="m9.5 6.5 5.5 5.5-5.5 5.5" />,
  chevronLeft: <path d="M14.5 6.5 9 12l5.5 5.5" />,
  arrowRight: <path d="M4.8 12h14.4M13.4 6.2 19.2 12l-5.8 5.8" />,
  arrowLeft: <path d="M19.2 12H4.8M10.6 6.2 4.8 12l5.8 5.8" />,
  arrowUpRight: <path d="M7.5 16.5 16.5 7.5M8.8 7.5h7.7v7.7" />,
  edit: (
    <>
      <path d="M16.4 3.9a2 2 0 0 1 2.8 2.8L8.6 17.3l-3.9 1.1 1.1-3.9Z" />
      <path d="m14.6 5.7 3.7 3.7" />
    </>
  ),
  trash: (
    <>
      <path d="M4.6 6.6h14.8M9.4 6.6V5a1.4 1.4 0 0 1 1.4-1.4h2.4A1.4 1.4 0 0 1 14.6 5v1.6" />
      <path d="M17.6 6.6 17 19a1.5 1.5 0 0 1-1.5 1.4h-7A1.5 1.5 0 0 1 7 19l-.6-12.4M10.3 10.4v6M13.7 10.4v6" />
    </>
  ),
  restore: <path d="M4.5 9.5h5v-5M4.9 9.1a8 8 0 1 1-.7 5.4" />,
  download: <path d="M12 4.2v11M7.4 10.8 12 15.4l4.6-4.6M4.6 19.4h14.8" />,
  upload: <path d="M12 15.4v-11M7.4 8.8 12 4.2l4.6 4.6M4.6 19.4h14.8" />,
  print: (
    <>
      <path d="M7 9V4.6h10V9M7 17.4H5.4a1.6 1.6 0 0 1-1.6-1.6v-5.2A1.6 1.6 0 0 1 5.4 9h13.2a1.6 1.6 0 0 1 1.6 1.6v5.2a1.6 1.6 0 0 1-1.6 1.6H17" />
      <rect x="7" y="14" width="10" height="5.6" rx="1" />
    </>
  ),
  qr: (
    <>
      <rect x="3.8" y="3.8" width="6" height="6" rx="1.2" />
      <rect x="14.2" y="3.8" width="6" height="6" rx="1.2" />
      <rect x="3.8" y="14.2" width="6" height="6" rx="1.2" />
      <path d="M14.2 14.2h2.6v2.6h-2.6zM20.2 14.2v2.6M17.6 20.2h2.6M14.2 20.2h.01" />
    </>
  ),
  scan: <path d="M3.8 8.4V5.4a1.6 1.6 0 0 1 1.6-1.6h3M3.8 15.6v3a1.6 1.6 0 0 0 1.6 1.6h3M20.2 8.4v-3a1.6 1.6 0 0 0-1.6-1.6h-3M20.2 15.6v3a1.6 1.6 0 0 1-1.6 1.6h-3M7 12h10" />,
  bell: (
    <>
      <path d="M18 9.2a6 6 0 0 0-12 0c0 5-2 6.4-2 6.4h16s-2-1.4-2-6.4Z" />
      <path d="M13.7 19.2a2 2 0 0 1-3.4 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="2.8" />
      <path d="M19.1 14.4a1.4 1.4 0 0 0 .3 1.5l.1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.4 1.4 0 0 0-2.4 1v.2a1.7 1.7 0 0 1-3.4 0v-.1a1.4 1.4 0 0 0-2.4-1l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.4 1.4 0 0 0-1-2.4H5a1.7 1.7 0 0 1 0-3.4h.1a1.4 1.4 0 0 0 1-2.4l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.4 1.4 0 0 0 2.4-1V5a1.7 1.7 0 0 1 3.4 0v.1a1.4 1.4 0 0 0 2.4 1l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.4 1.4 0 0 0 1 2.4h.2a1.7 1.7 0 0 1 0 3.4h-.1a1.4 1.4 0 0 0-1.3.8Z" />
    </>
  ),
  logout: <path d="M9.4 20.2H6a1.8 1.8 0 0 1-1.8-1.8V5.6A1.8 1.8 0 0 1 6 3.8h3.4M15.4 16.2l4.4-4.2-4.4-4.2M19.4 12H9.2" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3.2v1.9M12 18.9v1.9M5.8 5.8l1.4 1.4M16.8 16.8l1.4 1.4M3.2 12h1.9M18.9 12h1.9M5.8 18.2l1.4-1.4M16.8 7.2l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M3.8 12h16.4M12 3.6a13 13 0 0 1 0 16.8 13 13 0 0 1 0-16.8Z" />
    </>
  ),
  chart: <path d="M4.2 19.8V10M10.1 19.8V4.6M16 19.8v-6.4M21.5 19.8H3" />,
  trend: <path d="M3.8 16.4 9.2 11l3.4 3.4 7.6-7.6M15.4 6.8h4.8v4.8" />,
  coins: (
    <>
      <ellipse cx="12" cy="6.6" rx="7.2" ry="2.8" />
      <path d="M4.8 6.6v4.8c0 1.55 3.22 2.8 7.2 2.8s7.2-1.25 7.2-2.8V6.6" />
      <path d="M4.8 11.4v5c0 1.55 3.22 2.8 7.2 2.8s7.2-1.25 7.2-2.8v-5" />
    </>
  ),
  filter: <path d="M4.2 5.4h15.6l-6 7.1v5.6l-3.6 2v-7.6Z" />,
  grid: (
    <>
      <rect x="3.8" y="3.8" width="6.6" height="6.6" rx="1.4" />
      <rect x="13.6" y="3.8" width="6.6" height="6.6" rx="1.4" />
      <rect x="3.8" y="13.6" width="6.6" height="6.6" rx="1.4" />
      <rect x="13.6" y="13.6" width="6.6" height="6.6" rx="1.4" />
    </>
  ),
  list: <path d="M8.4 6.4h11.4M8.4 12h11.4M8.4 17.6h11.4M4.2 6.4h.01M4.2 12h.01M4.2 17.6h.01" />,
  history: <path d="M3.8 9.4h5v-5M4.4 9a8 8 0 1 1-.9 5M12 8v4.4l3 1.8" />,
  shield: (
    <>
      <path d="M12 3.4 5 6.2v5.1c0 4.3 2.9 8.3 7 9.3 4.1-1 7-5 7-9.3V6.2Z" />
      <path d="m9.2 12 2 2 3.6-3.8" />
    </>
  ),
  star: <path d="m12 4 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.6-5 2.6.9-5.6-4-4 5.6-.8Z" />,
  inbox: (
    <>
      <path d="M3.8 12.8h4l1.4 2.4h5.6l1.4-2.4h4" />
      <path d="M6 4.8h12l2.2 8v4.4a2 2 0 0 1-2 2H5.8a2 2 0 0 1-2-2v-4.4Z" />
    </>
  ),
  refresh: <path d="M20 11a8 8 0 0 0-13.6-4.6L3.8 8.8M4 13a8 8 0 0 0 13.6 4.6l2.6-2.4M20.2 4.6v4.2H16M3.8 19.4v-4.2H8" />,
  menu: <path d="M4 7.2h16M4 12h16M4 16.8h16" />,
  eye: (
    <>
      <path d="M2.6 12S6 5.8 12 5.8 21.4 12 21.4 12 18 18.2 12 18.2 2.6 12 2.6 12Z" />
      <circle cx="12" cy="12" r="2.9" />
    </>
  ),
  eyeOff: <path d="M9.6 6.2A8.7 8.7 0 0 1 12 5.8c6 0 9.4 6.2 9.4 6.2a16.4 16.4 0 0 1-3 3.8M6.5 7.9A16.3 16.3 0 0 0 2.6 12S6 18.2 12 18.2a8.9 8.9 0 0 0 3.6-.75M10 10.1a2.9 2.9 0 0 0 4 4M3.8 3.8l16.4 16.4" />,
  mail: (
    <>
      <rect x="3.2" y="5.4" width="17.6" height="13.2" rx="2.2" />
      <path d="m3.8 7 7.1 5a2 2 0 0 0 2.2 0l7.1-5" />
    </>
  ),
  lock: (
    <>
      <rect x="4.6" y="10.4" width="14.8" height="9.8" rx="2.2" />
      <path d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6" />
    </>
  ),
  wifiOff: <path d="M3.8 3.8l16.4 16.4M8.4 15.2a5 5 0 0 1 5.4-1M5 11.6a10 10 0 0 1 3.2-2M19 11.6a10 10 0 0 0-6.6-2.6M12 19h.01" />,
  sparkle: <path d="M12 3.6 13.7 9l5.4 1.7-5.4 1.7L12 17.8l-1.7-5.4L4.9 10.7 10.3 9Z" />,
};

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  /** Pixel size for both dimensions. Defaults to 20. */
  size?: number;
}

const Icon: React.FC<IconProps> = ({ name, size = 20, className, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    {PATHS[name]}
  </svg>
);

export default Icon;
