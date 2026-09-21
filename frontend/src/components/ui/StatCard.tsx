import React from "react";
import cn from "./cn";
import Icon, { IconName } from "./Icon";

export type StatTone = "brand" | "info" | "warning" | "danger" | "neutral" | "accent";

const TONES: Record<StatTone, { chip: string; bar: string; text: string }> = {
  brand: {
    chip: "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
    bar: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  info: {
    chip: "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300",
    bar: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-400",
  },
  warning: {
    chip: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
    bar: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },
  danger: {
    chip: "border-red-100 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300",
    bar: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
  },
  accent: {
    chip: "border-purple-100 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/60 dark:text-purple-300",
    bar: "bg-purple-500",
    text: "text-purple-700 dark:text-purple-400",
  },
  neutral: {
    chip: "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
    bar: "bg-gray-400",
    text: "text-gray-700 dark:text-gray-300",
  },
};

export interface StatCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Secondary line: a comparison, a breakdown, a share. */
  sub?: React.ReactNode;
  icon?: IconName;
  tone?: StatTone;
  /** 0–100. Renders a progress rail under the value. */
  progress?: number;
  className?: string;
  onClick?: () => void;
}

/**
 * KPI tile.
 *
 * The label sits above the number rather than beside it, so a row of tiles
 * lines up on two baselines — labels on one, figures on another. Numbers use
 * tabular figures (set globally on `[data-numeric]`) so 1,204 and 1,999 are
 * exactly the same width and the row doesn't shimmy as data refreshes.
 */
const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  icon,
  tone = "brand",
  progress,
  className,
  onClick,
}) => {
  const t = TONES[tone];
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex flex-col rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5",
        onClick &&
          "transition-all duration-250 ease-spring hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md active:scale-[0.99] dark:hover:border-gray-700",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.8125rem] font-medium leading-snug text-gray-500 dark:text-gray-400">
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
              t.chip
            )}
            aria-hidden="true"
          >
            <Icon name={icon} size={17} />
          </span>
        )}
      </div>

      <p
        data-numeric
        className="mt-2.5 font-display text-2xl font-semibold leading-none tracking-tight text-gray-900 dark:text-white sm:text-[1.75rem]"
      >
        {value}
      </p>

      {typeof progress === "number" && (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn("h-full rounded-full transition-all duration-700 ease-out", t.bar)}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {sub && (
        <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {sub}
        </p>
      )}
    </Tag>
  );
};

/** Coloured fragment for use inside a StatCard's `sub` line. */
export const StatAccent: React.FC<{
  tone?: StatTone;
  children: React.ReactNode;
}> = ({ tone = "brand", children }) => (
  <span className={cn("font-semibold", TONES[tone].text)}>{children}</span>
);

export default StatCard;
