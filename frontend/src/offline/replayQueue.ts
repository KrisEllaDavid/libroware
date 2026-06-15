import { ApolloClient, DocumentNode } from "@apollo/client";
import { CREATE_BORROW, RETURN_BOOK } from "../graphql/mutations";
import { ToastType } from "../context/ToastContext";
import { dequeue, getQueue, QueuedMutation, QueuedMutationType, updateRetryCount } from "./offlineQueue";

const MUTATION_DOCS: Record<QueuedMutationType, DocumentNode> = {
  CREATE_BORROW,
  RETURN_BOOK,
};

const MAX_RETRIES = 3;

// Error messages thrown by the backend that mean the queued action can no longer
// succeed (someone else took the last copy, book already returned, the due date
// computed while offline is now in the past, etc.) — not transient, so drop the
// item and let the post-drain refetch reconcile the UI to the real server state.
const CONFLICT_MESSAGES = [
  "Book is not available for borrowing",
  "Book is already returned",
  "Borrow record not found",
  "Book not found",
  "User not found",
  "dueDate must be in the future",
];

const describeFailure = (item: QueuedMutation, message: string): string => {
  const action = item.type === "CREATE_BORROW" ? "borrow" : "return";
  return `Couldn't complete a queued ${action}: ${message}`;
};

/**
 * Replays queued mutations in order against the server. Intended to be called
 * once connectivity returns, before reFetchObservableQueries() reconciles the
 * cache with the server's actual state.
 */
export const drainQueue = async (
  client: ApolloClient<object>,
  addToast: (message: string, type: ToastType) => void
): Promise<void> => {
  for (const item of getQueue()) {
    const mutation = MUTATION_DOCS[item.type];
    if (!mutation) {
      dequeue(item.id);
      continue;
    }

    try {
      await client.mutate({ mutation, variables: item.variables, fetchPolicy: "no-cache" });
      dequeue(item.id);
    } catch (err: any) {
      const message: string = err?.message || "Unknown error";
      const isConflict = CONFLICT_MESSAGES.some((m) => message.includes(m));

      if (isConflict) {
        dequeue(item.id);
        addToast(describeFailure(item, message), "warning");
      } else if (item.retryCount + 1 >= MAX_RETRIES) {
        dequeue(item.id);
        addToast(describeFailure(item, message), "error");
      } else {
        updateRetryCount(item.id, item.retryCount + 1);
        // Stop here on a transient/network error to preserve FIFO order —
        // the remaining items (and this one) will be retried on the next reconnect.
        break;
      }
    }
  }
};
