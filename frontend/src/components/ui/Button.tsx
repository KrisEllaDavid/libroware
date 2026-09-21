import React from "react";
import cn from "./cn";
import Icon, { IconName } from "./Icon";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "destructive"
  | "subtle";

export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md dark:hover:bg-emerald-500",
  secondary:
    "border border-gray-200 bg-white text-gray-700 shadow-xs hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-700",
  ghost:
    "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
  outline:
    "border border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-900/30",
  destructive:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md",
  subtle:
    "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[0.8125rem]",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-[0.9375rem]",
};

const ICON_SIZES: Record<ButtonSize, number> = { sm: 16, md: 18, lg: 18 };

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon. */
  icon?: IconName;
  /** Trailing icon. */
  iconAfter?: IconName;
  /** Swaps the leading icon for a spinner and blocks interaction. */
  loading?: boolean;
  /** Stretches to the container width. Common on mobile toolbars. */
  block?: boolean;
}

/**
 * The app's button.
 *
 * `active:scale-[0.985]` is the one bit of motion every variant shares — the
 * press has to register physically, otherwise a tap on a touch device gives no
 * feedback at all until the network comes back.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      icon,
      iconAfter,
      loading = false,
      block = false,
      className,
      children,
      disabled,
      type = "button",
      ...rest
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-lg font-medium leading-none",
        "transition-all duration-200 ease-soft active:scale-[0.985]",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        className
      )}
      {...rest}
    >
      {loading ? (
        <Spinner size={ICON_SIZES[size]} />
      ) : icon ? (
        <Icon name={icon} size={ICON_SIZES[size]} className="shrink-0" />
      ) : null}
      {children}
      {iconAfter && !loading && (
        <Icon name={iconAfter} size={ICON_SIZES[size]} className="shrink-0" />
      )}
    </button>
  )
);

Button.displayName = "Button";

/**
 * Square icon-only control with a soft radius.
 *
 * Kept square rather than circular so a row of row-actions in a table forms a
 * clean rail instead of a string of beads.
 */
export const IconButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, "children" | "icon" | "iconAfter" | "block"> & {
    icon: IconName;
    /** Required — an icon-only control has no accessible name otherwise. */
    label: string;
    tone?: "neutral" | "brand" | "danger";
  }
>(
  (
    {
      icon,
      label,
      tone = "neutral",
      size = "md",
      loading,
      className,
      disabled,
      type = "button",
      ...rest
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      title={label}
      aria-label={label}
      disabled={disabled || loading}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg transition-all duration-200 ease-soft",
        "active:scale-95 disabled:pointer-events-none disabled:opacity-40",
        size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9",
        tone === "brand"
          ? "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
          : tone === "danger"
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
        className
      )}
      {...rest}
    >
      {loading ? (
        <Spinner size={size === "sm" ? 15 : 17} />
      ) : (
        <Icon name={icon} size={size === "sm" ? 16 : 18} />
      )}
    </button>
  )
);

IconButton.displayName = "IconButton";

export const Spinner: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={cn("animate-spin shrink-0", className)}
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="2.25"
      className="opacity-25"
    />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
    />
  </svg>
);

export default Button;
