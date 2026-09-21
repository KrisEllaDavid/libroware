import React, { useId } from "react";
import cn from "./cn";
import Icon from "./Icon";

/* ──────────────────────────────────────────────────────────────────────────
   Field wrapper

   Label above, control, then hint or error below. A visible label beats a
   floating one for a data-entry app: it stays readable while the field has
   content, it doesn't collide with a value, and it survives translation into
   French without the label overrunning the box.
   ────────────────────────────────────────────────────────────────────────── */

export interface FieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({
  label,
  hint,
  error,
  required,
  htmlFor,
  className,
  children,
}) => (
  <div className={cn("w-full", className)}>
    {label && (
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
    )}
    {children}
    {error ? (
      <p className="mt-1.5 flex items-start gap-1 text-xs font-medium text-red-600 dark:text-red-400">
        <Icon name="alert" size={13} className="mt-px shrink-0" />
        <span>{error}</span>
      </p>
    ) : hint ? (
      <p className="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        {hint}
      </p>
    ) : null}
  </div>
);

const CONTROL = [
  "block w-full rounded-lg border bg-white px-3 text-sm text-gray-900 shadow-xs",
  "transition-all duration-200 ease-soft placeholder:text-gray-400",
  "focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60",
  "dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:disabled:bg-gray-900",
].join(" ");

const OK =
  "border-gray-200 hover:border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-gray-700 dark:hover:border-gray-600 dark:focus:border-emerald-500";

const BAD =
  "border-red-400 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500";

/* ── Input ───────────────────────────────────────────────────────────────── */

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  /** Decorative icon rendered inside the leading edge. */
  icon?: React.ComponentProps<typeof Icon>["name"];
  /** Node pinned to the trailing edge — a unit, a reveal toggle. */
  trailing?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      icon,
      trailing,
      required,
      className,
      wrapperClassName,
      id,
      ...rest
    },
    ref
  ) => {
    const auto = useId();
    const fieldId = id ?? auto;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        required={required}
        htmlFor={fieldId}
        className={wrapperClassName}
      >
        <div className="relative">
          {icon && (
            <Icon
              name={icon}
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
          )}
          <input
            ref={ref}
            id={fieldId}
            required={required}
            aria-invalid={error ? true : undefined}
            className={cn(
              CONTROL,
              "h-10",
              error ? BAD : OK,
              icon && "pl-9",
              trailing && "pr-10",
              className
            )}
            {...rest}
          />
          {trailing && (
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
              {trailing}
            </div>
          )}
        </div>
      </Field>
    );
  }
);
Input.displayName = "Input";

/* ── Textarea ────────────────────────────────────────────────────────────── */

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  wrapperClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, hint, error, required, className, wrapperClassName, id, rows = 3, ...rest },
    ref
  ) => {
    const auto = useId();
    const fieldId = id ?? auto;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        required={required}
        htmlFor={fieldId}
        className={wrapperClassName}
      >
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          className={cn(
            CONTROL,
            "resize-y py-2.5 leading-relaxed",
            error ? BAD : OK,
            className
          )}
          {...rest}
        />
      </Field>
    );
  }
);
Textarea.displayName = "Textarea";

/* ── Select ──────────────────────────────────────────────────────────────── */

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      hint,
      error,
      required,
      className,
      wrapperClassName,
      id,
      children,
      multiple,
      ...rest
    },
    ref
  ) => {
    const auto = useId();
    const fieldId = id ?? auto;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        required={required}
        htmlFor={fieldId}
        className={wrapperClassName}
      >
        <div className="relative">
          <select
            ref={ref}
            id={fieldId}
            required={required}
            multiple={multiple}
            aria-invalid={error ? true : undefined}
            className={cn(
              CONTROL,
              multiple
                ? "min-h-[7rem] py-2"
                : "h-10 cursor-pointer appearance-none pr-9",
              error ? BAD : OK,
              className
            )}
            {...rest}
          >
            {children}
          </select>
          {!multiple && (
            <Icon
              name="chevronDown"
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
          )}
        </div>
      </Field>
    );
  }
);
Select.displayName = "Select";

/* ── Search ──────────────────────────────────────────────────────────────── */

export interface SearchInputProps
  extends Omit<InputProps, "icon" | "trailing" | "label" | "type"> {
  value: string;
  onClear?: () => void;
}

/**
 * Search box with a clear affordance.
 *
 * The clear button appears only once there's something to clear, so the
 * control isn't carrying a dead X in its resting state.
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onClear, placeholder = "Search…", className, ...rest }, ref) => (
    <Input
      ref={ref}
      type="search"
      role="searchbox"
      value={value}
      placeholder={placeholder}
      icon="search"
      className={cn("[&::-webkit-search-cancel-button]:hidden", className)}
      trailing={
        value && onClear ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <Icon name="close" size={14} />
          </button>
        ) : undefined
      }
      {...rest}
    />
  )
);
SearchInput.displayName = "SearchInput";

/* ── Checkbox ────────────────────────────────────────────────────────────── */

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, id, ...rest }, ref) => {
    const auto = useId();
    const fieldId = id ?? auto;

    return (
      <div className={cn("flex items-start gap-2.5", className)}>
        <input
          ref={ref}
          id={fieldId}
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-emerald-600 transition-colors focus:ring-emerald-500/30 dark:border-gray-600 dark:bg-gray-800"
          {...rest}
        />
        {(label || description) && (
          <label htmlFor={fieldId} className="cursor-pointer select-none">
            {label && (
              <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                {label}
              </span>
            )}
            {description && (
              <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                {description}
              </span>
            )}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export default Field;
