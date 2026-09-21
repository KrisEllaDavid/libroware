import React from "react";
import cn from "./cn";

export interface CardProps
  extends React.HTMLAttributes<HTMLElement> {
  /** Lifts and deepens the shadow on hover. Only for cards you can click. */
  interactive?: boolean;
  /** Removes the shadow. For cards nested inside another surface. */
  flat?: boolean;
  /** Renders a different element — `li` inside a list, `section` in a page. */
  as?: "div" | "section" | "article" | "aside" | "li";
}

/**
 * The single card surface for the whole app.
 *
 * Opaque background, hairline border, soft tinted shadow. Elevation is carried
 * by the shadow, never by a blur or a translucent fill — those read as glass
 * and go muddy the moment a table scrolls underneath them.
 */
export const Card: React.FC<CardProps> = ({
  interactive = false,
  flat = false,
  as = "div",
  className,
  children,
  ...rest
}) => {
  const Tag = as as React.ElementType;
  return (
    <Tag
      className={cn(
        "rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
        flat ? "shadow-none" : "shadow-sm",
        interactive &&
          "transition-all duration-250 ease-spring hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg dark:hover:border-gray-700",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export interface CardHeaderProps
  // `title` on an HTML element is the tooltip string; here it's the heading
  // node, so the DOM attribute is omitted rather than shadowed.
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Right-hand slot: search fields, filters, primary action. */
  actions?: React.ReactNode;
  /** Drops the bottom rule — for headers that sit above a chart, not a table. */
  bare?: boolean;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  description,
  actions,
  bare = false,
  className,
  children,
  ...rest
}) => (
  <div
    className={cn(
      "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6",
      !bare && "border-b border-gray-200 dark:border-gray-800",
      className
    )}
    {...rest}
  >
    {(title || description) && (
      <div className="min-w-0">
        {title && (
          <h2 className="truncate font-display text-base font-semibold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h2>
        )}
        {description && (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
    )}
    {children}
    {actions && (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2.5">
        {actions}
      </div>
    )}
  </div>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div className={cn("px-5 py-5 sm:px-6", className)} {...rest}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div
    className={cn(
      "flex items-center gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6",
      className
    )}
    {...rest}
  >
    {children}
  </div>
);

/**
 * Section heading used inside a card body, above a chart or a sub-list.
 * Small, uppercase, wide-tracked — a label, not a title competing with the
 * card's own heading.
 */
export const SectionLabel: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...rest
}) => (
  <h3
    className={cn(
      "text-2xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400",
      className
    )}
    {...rest}
  >
    {children}
  </h3>
);

export default Card;
