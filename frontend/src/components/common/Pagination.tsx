import React from "react";
import { Icon, cn } from "../ui";

interface Props {
  page: number; // 0-based
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
  sizes?: number[];
}

/**
 * Pager.
 *
 * Every control here used to carry `px-5`, including the single-digit page
 * numbers — a "1" sat in a 50px-wide box while "Prev" sat in a 70px one, so
 * the row never lined up. Page buttons are now a fixed 34px square, which also
 * clears the 32px minimum a thumb needs, and the labels collapse to arrows
 * below `sm` where the full row can't fit.
 */
const Pagination: React.FC<Props> = ({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
  sizes = [10, 25, 50],
}) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  // First, last, current ±1, with ellipses for the gaps.
  const pageNums = (): (number | "…")[] => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i);
    const set = new Set(
      [0, pages - 1, page, page - 1, page + 1].filter((n) => n >= 0 && n < pages)
    );
    const sorted = [...set].sort((a, b) => a - b);
    const result: (number | "…")[] = [];
    sorted.forEach((n, i) => {
      if (i > 0 && n - sorted[i - 1] > 1) result.push("…");
      result.push(n);
    });
    return result;
  };

  if (total === 0) return null;

  const arrow =
    "inline-flex h-[34px] items-center justify-center gap-1 rounded-lg border border-gray-200 px-2.5 text-[0.8125rem] font-medium text-gray-600 transition-all duration-200 ease-soft hover:border-gray-300 hover:bg-gray-50 active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800";

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-5 py-3.5 dark:border-gray-800 sm:flex-row sm:px-6"
    >
      <div className="flex items-center gap-3 text-[0.8125rem] text-gray-500 dark:text-gray-400">
        <span data-numeric>
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {from.toLocaleString()}–{to.toLocaleString()}
          </span>{" "}
          of {total.toLocaleString()}
        </span>

        {onPageSize && (
          <select
            aria-label="Rows per page"
            value={pageSize}
            onChange={(e) => {
              onPageSize(Number(e.target.value));
              onPage(0);
            }}
            className="h-[34px] cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 transition-colors hover:border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s} per page
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page === 0}
          className={arrow}
          aria-label="Previous page"
        >
          <Icon name="chevronLeft" size={15} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="flex items-center gap-1">
          {pageNums().map((n, i) =>
            n === "…" ? (
              <span
                key={`gap-${i}`}
                aria-hidden="true"
                className="select-none px-1 text-sm text-gray-400"
              >
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => onPage(n)}
                aria-current={n === page ? "page" : undefined}
                aria-label={`Page ${n + 1}`}
                className={cn(
                  "inline-flex h-[34px] min-w-[34px] items-center justify-center rounded-lg border px-1.5 text-[0.8125rem] tabular-nums transition-all duration-200 ease-soft active:scale-95",
                  n === page
                    ? "border-emerald-600 bg-emerald-600 font-semibold text-white shadow-sm"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                )}
              >
                {n + 1}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages - 1}
          className={arrow}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <Icon name="chevronRight" size={15} />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
