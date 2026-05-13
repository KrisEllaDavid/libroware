import React from 'react';

interface Props {
  page:       number;       // 0-based
  pageSize:   number;
  total:      number;
  onPage:     (page: number) => void;
  onPageSize?: (size: number) => void;
  sizes?:     number[];
}

const Pagination: React.FC<Props> = ({
  page, pageSize, total, onPage,
  onPageSize,
  sizes = [10, 25, 50],
}) => {
  const pages    = Math.max(1, Math.ceil(total / pageSize));
  const from     = total === 0 ? 0 : page * pageSize + 1;
  const to       = Math.min((page + 1) * pageSize, total);

  // Build page number array (always show first, last, current ±1, with ellipsis)
  const pageNums = (): (number | '...')[] => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i);
    const set = new Set([0, pages - 1, page, page - 1, page + 1].filter(n => n >= 0 && n < pages));
    const sorted = [...set].sort((a, b) => a - b);
    const result: (number | '...')[] = [];
    sorted.forEach((n, i) => {
      if (i > 0 && (n as number) - (sorted[i - 1] as number) > 1) result.push('...');
      result.push(n);
    });
    return result;
  };

  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-3">
      {/* Info + page size */}
      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span>
          {from}–{to} of {total.toLocaleString()}
        </span>
        {onPageSize && (
          <select
            value={pageSize}
            onChange={e => { onPageSize(Number(e.target.value)); onPage(0); }}
            className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {sizes.map(s => <option key={s} value={s}>{s} per page</option>)}
          </select>
        )}
      </div>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 0}
          className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
        >
          ‹ Prev
        </button>

        {pageNums().map((n, i) =>
          n === '...' ? (
            <span key={`e${i}`} className="px-2 text-gray-400 text-xs select-none">…</span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n as number)}
              className={`min-w-[28px] px-2 py-1 text-xs rounded border transition-all ${
                n === page
                  ? 'bg-emerald-600 border-emerald-600 text-white font-medium'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {(n as number) + 1}
            </button>
          )
        )}

        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pages - 1}
          className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
        >
          Next ›
        </button>
      </div>
    </div>
  );
};

export default Pagination;
