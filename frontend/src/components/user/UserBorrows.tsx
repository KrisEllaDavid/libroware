import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@apollo/client";
import { fmtShort } from "../../utils/date";
import { RETURN_BOOK, CANCEL_BORROW_REQUEST } from "../../graphql/mutations";
import { USER_BORROWS } from "../../graphql/queries";
import { useToast } from "../../context/ToastContext";
import { useOfflineMutation } from "../../offline/useOfflineMutation";
import { useQueuedMutations } from "../../offline/useQueuedMutations";
import { adjustBookAvailable, setBorrowReturned } from "../../offline/cacheUpdates";
import {
  BookCover,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  CardGridSkeleton,
  SearchInput,
  Segmented,
  Tag,
  cn,
} from "../ui";

interface UserBorrowsProps {
  userId: string;
  borrows: {
    id: string;
    book: {
      id: string;
      title: string;
      isbn: string;
      authors: { id: string; name: string }[];
      coverImage: string | null;
    };
    borrowedAt: string;
    dueDate: string;
    returnedAt: string | null;
    status: string;
  }[];
  loading: boolean;
  error: any;
  refetch: () => void;
}

const UserBorrows: React.FC<UserBorrowsProps> = ({
  userId,
  borrows = [],
  loading,
  error,
  refetch,
}) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"all" | "active" | "returned">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [returningBorrowId, setReturningBorrowId] = useState<string | null>(null);
  const [cancellingBorrowId, setCancellingBorrowId] = useState<string | null>(null);
  const { addToast } = useToast();

  const queuedReturns = useQueuedMutations("RETURN_BOOK");

  const [returnBook] = useOfflineMutation(RETURN_BOOK, {
    type: "RETURN_BOOK",
    applyOptimistic: (cache, variables: { id: string }) => {
      const borrow = borrows.find((b) => b.id === variables.id);
      setBorrowReturned(cache, variables.id, new Date().toISOString());
      if (borrow) adjustBookAvailable(cache, borrow.book.id, 1);
    },
    queuedMessage: t("userBorrows.returnQueued"),
  }, {
    onCompleted: () => {
      setReturningBorrowId(null);
      refetch();
    },
    onError: (error: any) => {
      setReturningBorrowId(null);
      console.error("Error returning book:", error);
      addToast(t("userBorrows.failedReturn", { message: error.message }), "error");
    },
    refetchQueries: [{ query: USER_BORROWS, variables: { userId } }],
    onQueued: () => setReturningBorrowId(null),
  });

  const handleReturnBook = (borrowId: string) => {
    setReturningBorrowId(borrowId);
    returnBook({ variables: { id: borrowId } });
  };

  const isReturnQueued = (borrowId: string) =>
    queuedReturns.some((q) => (q.variables as { id: string }).id === borrowId);

  const [cancelBorrowRequest] = useMutation(CANCEL_BORROW_REQUEST, {
    onCompleted: () => {
      setCancellingBorrowId(null);
      addToast(t("userBorrows.requestCancelled"), "info");
      refetch();
    },
    onError: (error: any) => {
      setCancellingBorrowId(null);
      addToast(error.message, "error");
    },
  });

  const handleCancelRequest = (borrowId: string) => {
    setCancellingBorrowId(borrowId);
    cancelBorrowRequest({ variables: { id: borrowId } });
  };

  const filteredBorrows = borrows.filter((borrow) => {
    if (filter === "active" && (borrow.returnedAt !== null || borrow.status === "RETURNED")) return false;
    if (filter === "returned" && borrow.status !== "RETURNED") return false;

    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      return (
        borrow.book.title.toLowerCase().includes(searchLower) ||
        borrow.book.isbn.toLowerCase().includes(searchLower) ||
        borrow.book.authors.some((author) =>
          author.name.toLowerCase().includes(searchLower)
        )
      );
    }

    return true;
  });

  if (loading) return <CardGridSkeleton count={6} />;

  if (error) {
    return (
      <Card>
        <ErrorState
          message={t("userBorrows.errorLoading", { message: error.message })}
          onRetry={() => refetch()}
        />
      </Card>
    );
  }

  /** Days until (positive) or past (negative) the due date. */
  const daysLeft = (due: string) =>
    Math.ceil((new Date(due).getTime() - Date.now()) / 86_400_000);

  return (
    <Card>
      <CardHeader
        title={t("userDashboard.tabs.myBooks")}
        description={t("userBorrows.count", {
          count: filteredBorrows.length,
          defaultValue: `${filteredBorrows.length} books`,
        })}
        actions={
          <>
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm("")}
              placeholder={t("books.search")}
              wrapperClassName="sm:w-60"
            />
            <Segmented
              value={filter}
              onChange={(v) => setFilter(v as typeof filter)}
              options={[
                { value: "all", label: t("userBorrows.filterAll") },
                { value: "active", label: t("userBorrows.filterActive") },
                { value: "returned", label: t("userBorrows.filterReturned") },
              ]}
            />
          </>
        }
      />

      <div className="p-5 sm:p-6">
        {filteredBorrows.length === 0 ? (
          <EmptyState
            icon="books"
            title={
              searchTerm
                ? t("userBorrows.noMatch")
                : t("userBorrows.noBorrows")
            }
            description={
              searchTerm
                ? undefined
                : t(
                    "userBorrows.noBorrowsHint",
                    "Books you borrow will appear here with their due dates."
                  )
            }
            action={
              searchTerm ? (
                <Button variant="secondary" icon="close" onClick={() => setSearchTerm("")}>
                  {t("common.clearSearch", "Clear search")}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="stagger grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredBorrows.map((borrow, i) => {
              const isPending = borrow.status === "PENDING_APPROVAL";
              const isOverdue = borrow.status === "OVERDUE";
              const isReturned = Boolean(borrow.returnedAt);
              const left = daysLeft(borrow.dueDate);
              const dueSoon = !isReturned && !isPending && left >= 0 && left <= 3;

              return (
                <li key={borrow.id} style={{ ['--i' as any]: i }}>
                  <Card
                    className={cn(
                      "flex h-full flex-col overflow-hidden",
                      /* The state that needs action gets the coloured edge.
                         Everything calm stays neutral, so an overdue book is
                         visible from across the grid. */
                      isOverdue && "border-l-4 border-l-red-500",
                      dueSoon && "border-l-4 border-l-amber-500"
                    )}
                  >
                    <div className="flex gap-4 p-4">
                      <div className="h-[6.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-lg shadow-sm">
                        <BookCover
                          title={borrow.book.title}
                          src={borrow.book.coverImage}
                          author={borrow.book.authors.map((a) => a.name).join(", ")}
                          rounded="rounded-lg"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-white">
                          {borrow.book.title}
                        </h3>
                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                          {borrow.book.authors.map((a) => a.name).join(", ")}
                        </p>

                        <div className="mt-2">
                          <Tag
                            tone={
                              isPending
                                ? "warning"
                                : isOverdue
                                ? "danger"
                                : isReturned
                                ? "neutral"
                                : dueSoon
                                ? "warning"
                                : "brand"
                            }
                            dot
                          >
                            {isPending
                              ? t("borrows.PENDING_APPROVAL")
                              : isOverdue
                              ? t("borrows.OVERDUE")
                              : isReturned
                              ? t("borrows.RETURNED")
                              : t("userBorrows.statusActive")}
                          </Tag>
                        </div>

                        {/*
                          "Due in 2 days" beats a bare date: the member doesn't
                          have to do the arithmetic to know whether they're
                          about to be fined.
                        */}
                        {!isReturned && !isPending && (
                          <p
                            className={cn(
                              "mt-2 text-xs font-medium",
                              isOverdue
                                ? "text-red-600 dark:text-red-400"
                                : dueSoon
                                ? "text-amber-700 dark:text-amber-400"
                                : "text-gray-500 dark:text-gray-400"
                            )}
                          >
                            {isOverdue
                              ? `${Math.abs(left)} ${Math.abs(left) === 1 ? "day" : "days"} overdue`
                              : left === 0
                              ? "Due today"
                              : `Due in ${left} ${left === 1 ? "day" : "days"}`}
                          </p>
                        )}
                      </div>
                    </div>

                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-gray-100 px-4 py-3 text-xs dark:border-gray-800">
                      <div className="flex justify-between gap-2">
                        <dt className="text-gray-500 dark:text-gray-400">
                          {t("userBorrows.borrowedLabel")}
                        </dt>
                        <dd className="font-medium text-gray-700 dark:text-gray-200">
                          {fmtShort(borrow.borrowedAt)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-gray-500 dark:text-gray-400">
                          {t("userBorrows.dueLabel")}
                        </dt>
                        <dd className="font-medium text-gray-700 dark:text-gray-200">
                          {fmtShort(borrow.dueDate)}
                        </dd>
                      </div>
                      {borrow.returnedAt && (
                        <div className="col-span-2 flex justify-between gap-2">
                          <dt className="text-gray-500 dark:text-gray-400">
                            {t("userBorrows.returnedLabel")}
                          </dt>
                          <dd className="font-medium text-gray-700 dark:text-gray-200">
                            {fmtShort(borrow.returnedAt)}
                          </dd>
                        </div>
                      )}
                    </dl>

                    {/* The action sits at the card's foot, so a row of cards
                        with different title lengths still lines its buttons up. */}
                    {(isPending || !borrow.returnedAt) && (
                      <div className="mt-auto border-t border-gray-100 p-4 dark:border-gray-800">
                        {isPending ? (
                          <Button
                            block
                            icon="close"
                            onClick={() => handleCancelRequest(borrow.id)}
                            loading={cancellingBorrowId === borrow.id}
                          >
                            {t("userBorrows.cancelRequest")}
                          </Button>
                        ) : (
                          <Button
                            block
                            variant="primary"
                            icon="check"
                            onClick={() => handleReturnBook(borrow.id)}
                            disabled={isReturnQueued(borrow.id)}
                            loading={returningBorrowId === borrow.id}
                          >
                            {isReturnQueued(borrow.id)
                              ? t("userBorrows.returningSync")
                              : t("userBorrows.returnBook")}
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
};

export default UserBorrows;
