import React, { useEffect, useRef, useState } from "react";
import cn from "./cn";
import Icon, { IconName } from "./Icon";

export interface TabItem {
  id: string;
  label: string;
  icon?: IconName;
  /** Count shown after the label — pending requests, unpaid fines. */
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  /** Sticks the bar under the fixed nav while the page scrolls. */
  sticky?: boolean;
  className?: string;
}

/**
 * Primary tab bar.
 *
 * Underlined rather than filled. The admin panel has ten tabs; ten filled
 * green rectangles in a scrolling row is a wall of colour that competes with
 * the nav bar directly above it and leaves nothing for the page content. An
 * underline puts the emphasis on the label and lets the brand fill mean
 * "primary action" everywhere else.
 *
 * On narrow screens the row scrolls horizontally, and the fade on the trailing
 * edge is what tells you there is more to scroll to — without it, tab eleven
 * simply doesn't exist as far as the user is concerned.
 */
const Tabs: React.FC<TabsProps> = ({
  items,
  active,
  onChange,
  sticky = false,
  className,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ start: false, end: false });

  const measure = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setOverflow({
      start: el.scrollLeft > 4,
      end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  };

  useEffect(() => {
    measure();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [items.length]);

  // Keep the selected tab in view when the tab changes from elsewhere,
  // e.g. a deep link into ?tab=fines.
  useEffect(() => {
    const el = scrollerRef.current?.querySelector<HTMLElement>(
      `[data-tab-id="${active}"]`
    );
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = items.findIndex((t) => t.id === active);
    if (e.key === "ArrowRight" && i < items.length - 1) {
      e.preventDefault();
      onChange(items[i + 1].id);
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      onChange(items[i - 1].id);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(items[0].id);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(items[items.length - 1].id);
    }
  };

  return (
    <div
      className={cn(
        "relative border-b border-gray-200 dark:border-gray-800",
        sticky &&
          "sticky top-[var(--nav-h)] z-sticky -mx-4 bg-gray-50/95 px-4 backdrop-blur-none sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:bg-gray-950/95",
        className
      )}
    >
      <div
        ref={scrollerRef}
        role="tablist"
        onKeyDown={onKeyDown}
        className="-mb-px flex items-stretch gap-1 overflow-x-auto scrollbar-none"
      >
        {items.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors duration-200 ease-soft sm:px-4",
                isActive
                  ? "border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              )}
            >
              {tab.icon && <Icon name={tab.icon} size={16} className="shrink-0" />}
              {tab.label}
              {typeof tab.count === "number" && tab.count > 0 && (
                <span
                  className={cn(
                    "rounded-md px-1.5 py-px text-2xs font-semibold tabular-nums",
                    isActive
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  )}
                >
                  {tab.count > 99 ? "99+" : tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Scroll affordances */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-gray-50 to-transparent transition-opacity duration-200 dark:from-gray-950",
          overflow.start ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-50 to-transparent transition-opacity duration-200 dark:from-gray-950",
          overflow.end ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
};

export interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Segmented control for short, mutually exclusive filters (all / active /
 * returned). Replaces the three-button group with hand-rolled
 * `rounded-l-lg` + `border-t border-b` + `rounded-r-lg` seams, which broke
 * whenever an option was conditionally hidden.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      className={cn(
        "inline-flex items-center rounded-lg border border-gray-200 bg-gray-100 p-0.5 dark:border-gray-700 dark:bg-gray-800",
        className
      )}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md font-medium transition-all duration-200 ease-soft",
              size === "sm"
                ? "px-2.5 py-1 text-xs"
                : "px-3 py-1.5 text-[0.8125rem]",
              isActive
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
