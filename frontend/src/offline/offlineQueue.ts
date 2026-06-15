// Persisted FIFO queue of mutations that couldn't be sent while offline.
// Replayed in order by replayQueue.ts once connectivity returns.

export type QueuedMutationType = "CREATE_BORROW" | "RETURN_BOOK";

export interface QueuedMutation {
  id: string;
  type: QueuedMutationType;
  variables: Record<string, any>;
  createdAt: number;
  retryCount: number;
}

const STORAGE_KEY = "libroware-offline-queue";

type Listener = () => void;
const listeners = new Set<Listener>();

const generateId = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const readQueue = (): QueuedMutation[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// Stable in-memory reference so useSyncExternalStore's Object.is check sees
// the same value between writes and doesn't loop infinitely.
let _cachedQueue: QueuedMutation[] = readQueue();

const writeQueue = (queue: QueuedMutation[]): void => {
  _cachedQueue = queue;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // ignore — if persistence fails the queue still works for this session
  }
  listeners.forEach((listener) => listener());
};

export const getQueue = (): QueuedMutation[] => _cachedQueue;

export const enqueue = (item: Pick<QueuedMutation, "type" | "variables">): QueuedMutation => {
  const queued: QueuedMutation = {
    id: generateId(),
    type: item.type,
    variables: item.variables,
    createdAt: Date.now(),
    retryCount: 0,
  };
  writeQueue([..._cachedQueue, queued]);
  return queued;
};

export const dequeue = (id: string): void => {
  writeQueue(_cachedQueue.filter((item) => item.id !== id));
};

export const updateRetryCount = (id: string, retryCount: number): void => {
  writeQueue(_cachedQueue.map((item) => (item.id === id ? { ...item, retryCount } : item)));
};

export const subscribe = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
