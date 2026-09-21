import React, { useState } from "react";
import cn from "./cn";

/**
 * Person avatar.
 *
 * Falls back to initials on a tinted ground rather than a generic silhouette.
 * The tint is derived from the name, so the same member reads the same colour
 * in the user table, the borrow history and the nav — which is what makes a
 * list of thirty rows scannable without reading every name.
 */

const TINTS = [
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
];

const SIZES = {
  xs: "h-7 w-7 text-[0.625rem]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-xl",
  "2xl": "h-28 w-28 text-3xl",
};

export interface AvatarProps {
  src?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
  /** Ring in the brand colour — used for the signed-in user in the nav. */
  ring?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  firstName,
  lastName,
  name,
  size = "md",
  className,
  ring = false,
}) => {
  const [failed, setFailed] = useState(false);

  const full = name || [firstName, lastName].filter(Boolean).join(" ") || "";
  const initials =
    ((firstName?.[0] || full[0] || "?") + (lastName?.[0] || "")).toUpperCase();

  let h = 0;
  for (let i = 0; i < full.length; i++) h = (h * 31 + full.charCodeAt(i)) | 0;
  const tint = TINTS[Math.abs(h) % TINTS.length];

  const base = cn(
    "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold",
    SIZES[size],
    ring && "ring-2 ring-white/70 dark:ring-gray-900/70",
    className
  );

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={full ? `${full}'s profile picture` : "Profile picture"}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={cn(base, "bg-gray-100 object-cover dark:bg-gray-800")}
      />
    );
  }

  return (
    <span className={cn(base, tint)} aria-label={full || undefined} role="img">
      {initials}
    </span>
  );
};

export default Avatar;
