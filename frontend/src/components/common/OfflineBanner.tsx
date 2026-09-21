import React from "react";
import { useNetwork } from "../../context/NetworkContext";
import { Icon, Spinner, cn } from "../ui";

const formatLastSynced = (date: Date): string => {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

/**
 * Connection status bar.
 *
 * Pinned to the bottom edge, above the home indicator. Amber for offline, blue
 * while a queue drains — both at the `600` step rather than `500`, because
 * white text on the lighter tone missed the 4.5:1 contrast floor, and this is
 * the one strip of UI that has to stay readable on a bad screen in bad light.
 */
const OfflineBanner: React.FC = () => {
  const { isOnline, lastSyncedAt, pendingCount, isSyncing } = useNetwork();

  if (isOnline && !isSyncing) return null;

  const syncing = isOnline;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-0 bottom-0 z-nav flex items-center justify-center gap-2.5 px-4 py-2.5 text-sm font-medium text-white shadow-lg animate-slide-in-left",
        "pb-[calc(0.625rem+env(safe-area-inset-bottom))]",
        syncing ? "bg-blue-600" : "bg-amber-600"
      )}
    >
      {syncing ? (
        <Spinner size={15} />
      ) : (
        <Icon name="wifiOff" size={16} className="shrink-0" />
      )}

      <p className="min-w-0 truncate">
        {syncing ? (
          <>
            Syncing {pendingCount} action{pendingCount === 1 ? "" : "s"}
          </>
        ) : (
          <>
            <span>You're offline — showing saved data</span>
            {lastSyncedAt && (
              <span className="ml-1.5 hidden text-white/80 sm:inline">
                · last synced {formatLastSynced(lastSyncedAt)}
              </span>
            )}
            {pendingCount > 0 && (
              <span className="ml-1.5 text-white/80">
                · {pendingCount} waiting to sync
              </span>
            )}
          </>
        )}
      </p>
    </div>
  );
};

export default OfflineBanner;
