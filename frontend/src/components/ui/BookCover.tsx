import React, { useState } from "react";
import cn from "./cn";

/**
 * Book cover with a designed fallback.
 *
 * Most records in a real library catalogue have no cover art, and a grid of
 * grey rectangles labelled "No cover image" was the single worst-looking
 * surface in the app. Instead we draw one: a deterministic two-tone spine
 * derived from the title, with the title set on it.
 *
 * Deterministic matters — the same book gets the same cover on every render,
 * on every device, so the shelf stays recognisable and doesn't reshuffle its
 * colours when the query refetches.
 */

const PALETTE: Array<[string, string, string]> = [
  ["#1F7454", "#133C2F", "#D7ECE0"], // brand forest
  ["#2B5B8F", "#1B334D", "#D8E7F5"], // slate blue
  ["#A96620", "#563517", "#FAE9CE"], // amber leather
  ["#554485", "#302848", "#E4E0F2"], // plum
  ["#A73B34", "#582320", "#FADEDC"], // oxblood
  ["#2F8A66", "#164A38", "#EEF7F2"], // sage
  ["#45453F", "#1C1C19", "#E8E8E3"], // graphite
  ["#244972", "#0E1C2B", "#B2CDE9"], // navy
];

const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export interface BookCoverProps {
  title: string;
  src?: string | null;
  author?: string;
  className?: string;
  /** Controls the type size on the drawn fallback. */
  size?: "sm" | "md" | "lg";
  rounded?: string;
}

const BookCover: React.FC<BookCoverProps> = ({
  title,
  src,
  author,
  className,
  size = "md",
  rounded = "rounded-lg",
}) => {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  const [spine, deep, ink] = PALETTE[hash(title || "?") % PALETTE.length];

  if (showImage) {
    return (
      <img
        src={src as string}
        alt={`Cover of ${title}`}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={cn("h-full w-full bg-gray-100 object-cover dark:bg-gray-800", rounded, className)}
      />
    );
  }

  const titleSize =
    size === "lg" ? "text-base" : size === "sm" ? "text-[0.625rem]" : "text-xs";

  return (
    <div
      role="img"
      aria-label={`${title}${author ? ` by ${author}` : ""} — no cover image`}
      className={cn("relative h-full w-full overflow-hidden", rounded, className)}
      style={{ backgroundColor: spine }}
    >
      {/* Board: a subtle vertical fall of light across the cover. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(160deg, ${spine} 0%, ${deep} 100%)`,
        }}
      />

      {/* Spine: the binding edge, plus its highlight. */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[7%] min-w-[5px]"
        style={{ backgroundColor: deep }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-[7%] w-px opacity-25"
        style={{ backgroundColor: ink }}
      />

      {/* Rules, echoing a typeset title page. */}
      <div className="absolute inset-0 flex flex-col justify-between py-[9%] pl-[14%] pr-[9%]">
        <div
          aria-hidden="true"
          className="h-px w-8 opacity-40"
          style={{ backgroundColor: ink }}
        />
        <p
          className={cn(
            "line-clamp-4 font-display font-semibold leading-snug tracking-tight",
            titleSize
          )}
          style={{ color: ink }}
        >
          {title}
        </p>
        <div className="space-y-1">
          {author && size !== "sm" && (
            <p
              className="line-clamp-1 text-[0.625rem] uppercase tracking-wider opacity-70"
              style={{ color: ink }}
            >
              {author}
            </p>
          )}
          <div
            aria-hidden="true"
            className="h-px w-full opacity-25"
            style={{ backgroundColor: ink }}
          />
        </div>
      </div>
    </div>
  );
};

export default BookCover;
