import React, { useEffect, useRef, useId, useCallback } from "react";
import ReactDOM from "react-dom";
import { useToast } from "../context/ToastContext";
import { Button, Icon, IconName, cn } from "./ui";

interface ModalProps {
  isOpen: boolean;
  title?: React.ReactNode;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** May return a promise of anything — a mutation result is fine. */
  onConfirm?: () => unknown | Promise<unknown>;
  onCancel?: () => void;
  children?: React.ReactNode;
  type?:
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "confirm"
    | "form"
    | "delete";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showToast?: boolean;
  successMessage?: string;
  cancelMessage?: string;
  entityName?: string;
  /** Disable the confirm button (e.g. while a mutation is in flight). */
  confirmDisabled?: boolean;
  /**
   * By default the modal closes and shows a success toast as soon as
   * onConfirm settles. If onConfirm throws/rejects, the modal stays open
   * instead so the caller can show its own inline error and let the user
   * correct the form. Set this to keep the modal open even on success
   * (e.g. to let the user keep working in it).
   */
  keepOpenOnConfirm?: boolean;
}

/** Icon + accent per modal type. Replaces the emoji that used to sit in the title. */
const TYPE_STYLE: Record<
  NonNullable<ModalProps["type"]>,
  { icon: IconName | null; chip: string } | null
> = {
  success: {
    icon: "checkCircle",
    chip: "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-400",
  },
  warning: {
    icon: "warning",
    chip: "border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-400",
  },
  danger: {
    icon: "alert",
    chip: "border-red-100 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/60 dark:text-red-400",
  },
  delete: {
    icon: "trash",
    chip: "border-red-100 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/60 dark:text-red-400",
  },
  info: {
    icon: "info",
    chip: "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-400",
  },
  confirm: {
    icon: "checkCircle",
    chip: "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-400",
  },
  // Forms carry their own heading; an icon would just add noise.
  form: null,
};

const SIZES = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-3xl",
  full: "sm:max-w-5xl",
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  children,
  type = "info",
  size = "md",
  showToast = true,
  successMessage,
  cancelMessage,
  entityName = "",
  confirmDisabled = false,
  keepOpenOnConfirm = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const modalId = useId();
  const { addToast } = useToast();

  // Extract entity name from title if not provided directly
  const getEntityName = () => {
    if (entityName) return entityName;

    if (typeof title === "string") {
      const matches = title.match(
        /(?:Delete|Edit|Add|Create)\s+(?:New\s+)?(\w+)$/i
      );
      if (matches && matches[1]) {
        return matches[1];
      }
    }

    return "Item";
  };

  const generateSuccessMessage = () => {
    const entity = getEntityName();

    if (successMessage) return successMessage;

    if (type === "delete") {
      return `${entity} deleted`;
    } else if (type === "form") {
      if (confirmText.includes("Add") || confirmText.includes("Create")) {
        return `${entity} created`;
      } else if (
        confirmText.includes("Edit") ||
        confirmText.includes("Update")
      ) {
        return `${entity} updated`;
      } else {
        return `${entity} saved`;
      }
    } else {
      return `Done`;
    }
  };

  // Handle confirm action with toast notification.
  // onConfirm may reject (e.g. a failed mutation) — in that case the modal
  // stays open so the caller's own inline error stays visible, instead of
  // closing and showing a false "success" toast.
  const handleConfirm = async () => {
    if (!onConfirm) {
      if (onCancel) onCancel();
      return;
    }

    try {
      await onConfirm();
    } catch {
      return;
    }

    if (showToast) {
      addToast(generateSuccessMessage(), "success");
    }

    if (!keepOpenOnConfirm && onCancel) {
      onCancel();
    }
  };

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();

      if (showToast && cancelMessage) {
        addToast(cancelMessage, "info");
      }
    }
  }, [onCancel, showToast, cancelMessage, addToast]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleCancel();
      }
    };

    if (isOpen) {
      // Reserve the scrollbar's width so locking the body doesn't shift the
      // page sideways behind the backdrop.
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty(
        "--scrollbar-width",
        `${scrollbarWidth}px`
      );
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.paddingRight = "";
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.classList.remove("modal-open");
      document.body.style.paddingRight = "";
    };
  }, [isOpen, handleCancel]);

  // Trap focus inside the dialog while it is open. Without this, tabbing out
  // of a modal lands on the page behind it — which is still scroll-locked, so
  // the focus ring simply vanishes.
  useEffect(() => {
    if (!isOpen) return;
    const node = modalRef.current;
    if (!node) return;

    node.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = node.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const style = TYPE_STYLE[type];
  const isDelete = type === "delete";

  const modalContent = (
    <>
      <div
        className="fixed inset-0 z-backdrop bg-gray-900/40 animate-backdrop-appear dark:bg-gray-950/70"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/*
        Bottom sheet on a phone, centred dialog from `sm` up. A centred box on a
        360px screen leaves the confirm button under the thumb's reach and wastes
        the top third; anchoring to the bottom edge puts the actions where the
        hand already is.
      */}
      <div className="fixed inset-0 z-modal flex items-end justify-center sm:items-center sm:p-4">
        <div
          ref={modalRef}
          className={cn(
            "flex max-h-[92vh] w-full flex-col overflow-hidden bg-white shadow-2xl animate-toast-drop dark:bg-gray-900",
            "rounded-t-2xl sm:max-h-[85vh] sm:rounded-2xl",
            "border-t border-gray-200 sm:border dark:border-gray-800",
            SIZES[size]
          )}
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`modal-title-${modalId}`}
        >
          {/* Grab handle — the affordance that says "this sheet is dismissible". */}
          <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden="true">
            <span className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
          </div>

          <header className="flex items-start gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
            {style?.icon && (
              <span
                className={cn(
                  "mt-px inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                  style.chip
                )}
                aria-hidden="true"
              >
                <Icon name={style.icon} size={18} />
              </span>
            )}
            <h2
              id={`modal-title-${modalId}`}
              className="min-w-0 flex-1 self-center font-display text-base font-semibold tracking-tight text-gray-900 dark:text-white sm:text-lg"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={handleCancel}
              className="-mr-1.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <Icon name="close" size={18} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
            {message && (
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {message}
              </p>
            )}
            {message && children ? <div className="h-4" /> : null}
            {children}
          </div>

          {/*
            Actions stack full-width on a phone and sit right-aligned from `sm`
            up. Confirm is listed first in the stacked order so the primary
            action is closest to the thumb, and reversed with `sm:flex-row` so
            desktop keeps the conventional Cancel-then-Confirm reading order.
          */}
          <footer className="safe-bottom flex flex-col-reverse gap-2.5 border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-900/60 sm:flex-row sm:justify-end sm:px-6">
            <Button variant="secondary" onClick={handleCancel} className="sm:w-auto">
              {cancelText}
            </Button>

            {(type === "confirm" ||
              type === "form" ||
              type === "info" ||
              type === "success" ||
              type === "warning" ||
              type === "danger") && (
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={confirmDisabled}
                className="sm:w-auto"
              >
                {confirmText}
              </Button>
            )}

            {isDelete && (
              <Button
                variant="destructive"
                icon="trash"
                onClick={handleConfirm}
                disabled={confirmDisabled}
                className="sm:w-auto"
              >
                {confirmText === "Confirm" ? "Delete" : confirmText}
              </Button>
            )}
          </footer>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default Modal;
