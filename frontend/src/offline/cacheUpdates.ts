import { ApolloCache } from "@apollo/client";

// Shared optimistic cache edits applied immediately when a mutation is queued
// offline. Final reconciliation happens via reFetchObservableQueries once the
// queue is drained, so these only need to make the UI feel responsive — they
// don't need to be perfectly accurate or reversible.

export const adjustBookAvailable = (cache: ApolloCache<object>, bookId: string, delta: number): void => {
  cache.modify({
    id: cache.identify({ __typename: "Book", id: bookId }),
    fields: {
      available(existing: number) {
        return existing + delta;
      },
    },
  });
};

export const setBorrowReturned = (cache: ApolloCache<object>, borrowId: string, returnedAt: string): void => {
  cache.modify({
    id: cache.identify({ __typename: "Borrow", id: borrowId }),
    fields: {
      status: () => "RETURNED",
      returnedAt: () => returnedAt,
    },
  });
};
