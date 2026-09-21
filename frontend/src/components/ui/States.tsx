import React from "react";
import cn from "./cn";
import Icon, { IconName } from "./Icon";
import Button from "./Button";

/* ── Skeleton ────────────────────────────────────────────────────────────── */

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn("skeleton h-4 w-full", className)}
    aria-hidden="true"
  />
);

/**
 * Placeholder rows shaped like the table they stand in for.
 *
 * A skeleton that matches the final layout means the page doesn't jump when
 * the data lands — which is the entire point. A centred spinner tells you
 * nothing about what's coming and guarantees a reflow when it does.
 */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 6,
  cols = 4,
}) => (
  <div className="divide-y divide-gray-100 dark:divide-gray-800">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex items-center gap-4 px-4 py-3.5">
        {Array.from({ length: cols }).map((__, c) => (
          <Skeleton
            key={c}
            className={cn(
              "h-3.5",
              c === 0 ? "w-2/5" : c === cols - 1 ? "ml-auto w-16" : "w-1/5"
            )}
          />
        ))}
      </div>
    ))}
  </div>
);

export const CardGridSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 8,
  className,
}) => (
  <div
    className={cn(
      "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      className
    )}
  >
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      >
        <Skeleton className="h-44 rounded-none" />
        <div className="space-y-2.5 p-4">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-2/5" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    ))}
  </div>
);

export const StatSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
      >
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-7 w-16" />
        <Skeleton className="mt-2.5 h-2.5 w-24" />
      </div>
    ))}
  </div>
);

/* ── Empty state ─────────────────────────────────────────────────────────── */

export interface EmptyStateProps {
  icon?: IconName;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Primary action — "Add book", "Clear search". */
  action?: React.ReactNode;
  className?: string;
  /** Tighter variant for empty table bodies. */
  compact?: boolean;
}

/**
 * What a page shows when it has nothing to show.
 *
 * The line art behind the icon is deliberately low-contrast: it gives the
 * block enough presence not to read as a rendering failure, without turning
 * "you have no fines" into a celebration.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "inbox",
  title,
  description,
  action,
  className,
  compact = false,
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center px-6 text-center",
      compact ? "py-10" : "py-16",
      className
    )}
  >
    <div className="relative mb-4">
      <svg
        viewBox="0 0 120 120"
        className="h-20 w-20 text-gray-200 dark:text-gray-800"
        aria-hidden="true"
      >
        <circle
          cx="60"
          cy="60"
          r="46"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle
          cx="60"
          cy="60"
          r="32"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 5"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600">
        <Icon name={icon} size={30} />
      </span>
    </div>

    <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">
      {title}
    </h3>
    {description && (
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
        {description}
      </p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

/* ── Error state ─────────────────────────────────────────────────────────── */

export interface ErrorStateProps {
  title?: React.ReactNode;
  message?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Replaces the `<p>Error loading books: {message}</p>` that several pages
 * rendered straight into the layout. A failed query is a state the user can
 * act on, so it gets a retry.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  className,
  compact = false,
}) => (
  <div
    role="alert"
    className={cn(
      "flex flex-col items-center justify-center px-6 text-center",
      compact ? "py-10" : "py-16",
      className
    )}
  >
    <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
      <Icon name="warning" size={24} />
    </span>
    <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white">
      {title}
    </h3>
    {message && (
      <p className="mt-1.5 max-w-sm break-words text-sm leading-relaxed text-gray-500 dark:text-gray-400">
        {message}
      </p>
    )}
    {onRetry && (
      <Button
        variant="secondary"
        size="sm"
        icon="refresh"
        onClick={onRetry}
        className="mt-5"
      >
        {retryLabel}
      </Button>
    )}
  </div>
);

/* ── Inline alert ────────────────────────────────────────────────────────── */

export interface AlertProps {
  tone?: "info" | "warning" | "danger" | "success";
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const ALERT_TONES = {
  info: {
    box: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40",
    icon: "text-blue-600 dark:text-blue-400",
    text: "text-blue-900 dark:text-blue-200",
    glyph: "info" as IconName,
  },
  warning: {
    box: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
    icon: "text-amber-600 dark:text-amber-400",
    text: "text-amber-900 dark:text-amber-200",
    glyph: "warning" as IconName,
  },
  danger: {
    box: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40",
    icon: "text-red-600 dark:text-red-400",
    text: "text-red-900 dark:text-red-200",
    glyph: "alert" as IconName,
  },
  success: {
    box: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
    icon: "text-emerald-600 dark:text-emerald-400",
    text: "text-emerald-900 dark:text-emerald-200",
    glyph: "checkCircle" as IconName,
  },
};

export const Alert: React.FC<AlertProps> = ({
  tone = "info",
  title,
  children,
  className,
}) => {
  const t = ALERT_TONES[tone];
  return (
    <div
      className={cn("flex gap-3 rounded-lg border px-4 py-3", t.box, className)}
      role={tone === "danger" ? "alert" : "status"}
    >
      <Icon name={t.glyph} size={18} className={cn("mt-px shrink-0", t.icon)} />
      <div className={cn("min-w-0 text-sm leading-relaxed", t.text)}>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-0.5" : undefined}>{children}</div>}
      </div>
    </div>
  );
};

export default EmptyState;
