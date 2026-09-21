import React from "react";
import cn from "./cn";

/**
 * Table shell.
 *
 * Six admin screens each hand-rolled their own `<table>` chrome — different
 * header casing, different row padding, different divider colours. These
 * wrappers keep the markup semantic (still a real `<table>`, still
 * screen-reader navigable) while pinning the chrome to one definition.
 *
 * `hideBelow` on a cell is how columns drop on small screens. The convention:
 * the first column always survives and absorbs the dropped values as a
 * secondary line underneath, so nothing becomes unreachable on a phone.
 */

export const TableWrap: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div
    className={cn("w-full overflow-x-auto [-webkit-overflow-scrolling:touch]", className)}
    {...rest}
  >
    {children}
  </div>
);

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  className,
  children,
  ...rest
}) => (
  <table className={cn("min-w-full border-collapse text-sm", className)} {...rest}>
    {children}
  </table>
);

export const THead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...rest
}) => (
  <thead
    className={cn("bg-gray-50 dark:bg-gray-900/60", className)}
    {...rest}
  >
    {children}
  </thead>
);

export const TBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...rest
}) => (
  <tbody
    className={cn("divide-y divide-gray-100 dark:divide-gray-800", className)}
    {...rest}
  >
    {children}
  </tbody>
);

export const TR: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  children,
  ...rest
}) => (
  <tr
    className={cn(
      "transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/50",
      className
    )}
    {...rest}
  >
    {children}
  </tr>
);

type Breakpoint = "sm" | "md" | "lg" | "xl";

const HIDE: Record<Breakpoint, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

export interface CellProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Hide this column until the viewport reaches this breakpoint. */
  hideBelow?: Breakpoint;
  align?: "left" | "center" | "right";
}

export const TH: React.FC<CellProps> = ({
  hideBelow,
  align = "left",
  className,
  children,
  ...rest
}) => (
  <th
    scope="col"
    className={cn(
      "whitespace-nowrap border-b border-gray-200 px-4 py-3 text-2xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:text-gray-400",
      align === "right"
        ? "text-right"
        : align === "center"
        ? "text-center"
        : "text-left",
      hideBelow && HIDE[hideBelow],
      className
    )}
    {...rest}
  >
    {children}
  </th>
);

export const TD: React.FC<
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    hideBelow?: Breakpoint;
    align?: "left" | "center" | "right";
  }
> = ({ hideBelow, align = "left", className, children, ...rest }) => (
  <td
    className={cn(
      "px-4 py-3.5 align-middle text-gray-600 dark:text-gray-300",
      align === "right"
        ? "text-right"
        : align === "center"
        ? "text-center"
        : "text-left",
      hideBelow && HIDE[hideBelow],
      className
    )}
    {...rest}
  >
    {children}
  </td>
);

/** Row-action rail. Right-aligned, tight, consistent across every table. */
export const RowActions: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div
    className={cn("flex items-center justify-end gap-0.5", className)}
    {...rest}
  >
    {children}
  </div>
);

/** Full-width cell for the empty / loading / error state inside a tbody. */
export const TableMessage: React.FC<{
  colSpan: number;
  children: React.ReactNode;
}> = ({ colSpan, children }) => (
  <tr>
    <td colSpan={colSpan} className="p-0">
      {children}
    </td>
  </tr>
);

/**
 * The value a column drops to on small screens.
 *
 * Rendered as a secondary line under the primary cell, visible only below the
 * breakpoint where its column reappears.
 */
export const StackedMeta: React.FC<{
  showBelow?: Breakpoint;
  label?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ showBelow = "sm", label, children, className }) => (
  <div
    className={cn(
      "mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400",
      showBelow === "sm"
        ? "sm:hidden"
        : showBelow === "md"
        ? "md:hidden"
        : showBelow === "lg"
        ? "lg:hidden"
        : "xl:hidden",
      className
    )}
  >
    {label && <span className="font-medium">{label} </span>}
    {children}
  </div>
);

export default Table;
