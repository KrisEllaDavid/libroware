import React from "react";
import cn from "./cn";
import Icon, { IconName } from "./Icon";

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small label above the title — section or role context. */
  eyebrow?: React.ReactNode;
  icon?: IconName;
  /** Buttons, filters. Wraps below the title on narrow screens. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * The block that opens every page.
 *
 * Before this, each page invented its own: `text-2xl font-bold mb-6` here,
 * `text-lg leading-6 font-medium` there, some with a description and some
 * without. A shared header is what makes navigating between the admin tabs
 * feel like one product.
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  eyebrow,
  icon,
  actions,
  className,
}) => (
  <header
    className={cn(
      "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",
      className
    )}
  >
    <div className="flex min-w-0 items-start gap-3.5">
      {icon && (
        <span
          className="mt-0.5 hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 sm:inline-flex"
          aria-hidden="true"
        >
          <Icon name={icon} size={22} />
        </span>
      )}
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-2xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
    </div>

    {actions && (
      <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>
    )}
  </header>
);

export default PageHeader;
