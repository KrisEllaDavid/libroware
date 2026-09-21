import React from "react";
import ReactDOM from "react-dom";
import { useToast, ToastType } from "../../context/ToastContext";
import { Icon, IconName, cn } from "../ui";

/**
 * Toast stack.
 *
 * Two things changed from the previous implementation, both about not
 * interrupting the user:
 *
 * 1. No full-viewport backdrop. Dimming and blurring the entire application to
 *    announce "Book updated" treats a confirmation like a modal — it made the
 *    page look broken for the three seconds the toast was up.
 * 2. Anchored bottom-right on desktop, top-centre on mobile. Bottom-right sits
 *    out of the reading path; on a phone there is no bottom-right worth
 *    speaking of and the thumb lives there, so it goes to the top instead.
 *
 * Solid surfaces with a coloured rail rather than a saturated fill: white text
 * on a mid-tone green fails contrast at small sizes, and a wall of colour makes
 * an ordinary "saved" feel like an incident.
 */

const TONE: Record<
  ToastType,
  { rail: string; icon: IconName; iconColor: string }
> = {
  success: {
    rail: "bg-emerald-500",
    icon: "checkCircle",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  error: {
    rail: "bg-red-500",
    icon: "alert",
    iconColor: "text-red-600 dark:text-red-400",
  },
  warning: {
    rail: "bg-amber-500",
    icon: "warning",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  info: {
    rail: "bg-blue-500",
    icon: "info",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
};

const ToastNotification: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return ReactDOM.createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-20 z-toast flex flex-col items-center gap-2.5 px-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:items-end sm:px-0"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const tone = TONE[toast.type] ?? TONE.info;
        return (
          <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            aria-live={toast.type === "error" ? "assertive" : "polite"}
            className={cn(
              "pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white py-3 pl-5 pr-2.5 shadow-xl",
              "animate-toast-drop dark:border-gray-700 dark:bg-gray-800 sm:w-auto sm:min-w-[18rem]"
            )}
          >
            {/* Colour rail — the status read, without staining the whole card. */}
            <span
              className={cn("absolute inset-y-0 left-0 w-1", tone.rail)}
              aria-hidden="true"
            />
            <Icon
              name={tone.icon}
              size={18}
              className={cn("mt-px shrink-0", tone.iconColor)}
            />
            <p className="min-w-0 flex-1 break-words text-sm font-medium leading-relaxed text-gray-800 dark:text-gray-100">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="-mr-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              aria-label="Dismiss"
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
};

export default ToastNotification;
