import React from "react";
import cn from "./cn";
import Icon, { IconName } from "./Icon";

/**
 * `accent` (purple) is reserved for the administrator role — the one label
 * that needs to be distinct from every borrow state without implying
 * success, warning or failure.
 */
export type TagTone =
  | "neutral"
  | "brand"
  | "warning"
  | "danger"
  | "info"
  | "accent";

const TONES: Record<TagTone, string> = {
  neutral:
    "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
  brand:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  danger:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200",
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  accent:
    "border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
};

const DOT: Record<TagTone, string> = {
  neutral: "bg-gray-400 dark:bg-gray-500",
  brand: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  accent: "bg-purple-500",
};

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: TagTone;
  icon?: IconName;
  /** Small status dot in place of an icon. */
  dot?: boolean;
  size?: "sm" | "md";
}

/**
 * Status / category label.
 *
 * Rectangular with a soft radius rather than a rounded-full pill. A pill reads
 * as a marketing badge; this is data — a category, a borrow state, a role —
 * and it sits inside dense table rows where a pill's horizontal padding
 * wrecks the column rhythm.
 */
export const Tag: React.FC<TagProps> = ({
  tone = "neutral",
  icon,
  dot = false,
  size = "md",
  className,
  children,
  ...rest
}) => (
  <span
    className={cn(
      "inline-flex max-w-full items-center gap-1.5 rounded-md border font-medium",
      size === "sm"
        ? "px-1.5 py-0.5 text-2xs leading-4"
        : "px-2 py-0.5 text-xs leading-5",
      // Fall back rather than render an unstyled tag if a caller passes a
      // tone that isn't in the map.
      TONES[tone] ?? TONES.neutral,
      className
    )}
    {...rest}
  >
    {dot && (
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT[tone] ?? DOT.neutral)}
        aria-hidden="true"
      />
    )}
    {icon && <Icon name={icon} size={size === "sm" ? 11 : 13} className="shrink-0" />}
    <span className="truncate">{children}</span>
  </span>
);

/** Maps a borrow / reservation / fine status onto a tone. */
export const statusTone = (status?: string | null): TagTone => {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
    case "BORROWED":
    case "APPROVED":
    case "RETURNED":
    case "PAID":
    case "FULFILLED":
    case "COMPLETED":
      return "brand";
    case "PENDING":
    case "PENDING_APPROVAL":
    case "RESERVED":
    case "AWAITING":
    case "WAIVED":
      return "warning";
    case "OVERDUE":
    case "REJECTED":
    case "CANCELLED":
    case "CANCELED":
    case "LOST":
    case "UNPAID":
      return "danger";
    case "READ":
    case "READING":
      return "info";
    default:
      return "neutral";
  }
};

export interface StatusTagProps extends Omit<TagProps, "tone" | "children"> {
  status?: string | null;
  /** Display text. Falls back to a title-cased status. */
  label?: React.ReactNode;
}

/** Status label that picks its own colour from the status value. */
export const StatusTag: React.FC<StatusTagProps> = ({
  status,
  label,
  ...rest
}) => (
  <Tag tone={statusTone(status)} dot {...rest}>
    {label ??
      (status || "—")
        .toString()
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase())}
  </Tag>
);

export default Tag;
