import { useSyncExternalStore } from "react";
import { getQueue, subscribe, QueuedMutation, QueuedMutationType } from "./offlineQueue";

/** Reactive view of the offline queue, optionally filtered by mutation type. */
export const useQueuedMutations = (type?: QueuedMutationType): QueuedMutation[] => {
  const queue = useSyncExternalStore(subscribe, getQueue);
  return type ? queue.filter((item) => item.type === type) : queue;
};
