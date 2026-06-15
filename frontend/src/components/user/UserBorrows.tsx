import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { RETURN_BOOK } from "../../graphql/mutations";
import { USER_BORROWS } from "../../graphql/queries";
import { useToast } from "../../context/ToastContext";
import { useOfflineMutation } from "../../offline/useOfflineMutation";
import { useQueuedMutations } from "../../offline/useQueuedMutations";
import { adjustBookAvailable, setBorrowReturned } from "../../offline/cacheUpdates";

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

  const filteredBorrows = borrows.filter((borrow) => {
    if (filter === "active" && borrow.returnedAt !== null) return false;
    if (filter === "returned" && borrow.returnedAt === null) return false;

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

  if (loading)
    return <div className="text-center py-4">{t("userBorrows.loading")}</div>;
  if (error)
    return (
      <div className="text-red-500 py-4">
        {t("userBorrows.errorLoading", { message: error.message })}
      </div>
    );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3 sm:mb-0">
          {t("userDashboard.tabs.myBooks")}
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder={t("books.search")}
              className="pl-8 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                filter === "all"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              {t("userBorrows.filterAll")}
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 text-sm font-medium border-t border-b ${
                filter === "active"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              {t("userBorrows.filterActive")}
            </button>
            <button
              onClick={() => setFilter("returned")}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
                filter === "returned"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              {t("userBorrows.filterReturned")}
            </button>
          </div>
        </div>
      </div>

      {filteredBorrows.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchTerm
            ? t("userBorrows.noMatch")
            : t("userBorrows.noBorrows")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBorrows.map((borrow) => (
            <div
              key={borrow.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow overflow-hidden flex flex-col"
            >
              <div className="h-48 bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                {borrow.book.coverImage ? (
                  <img
                    src={borrow.book.coverImage}
                    alt={borrow.book.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 dark:text-gray-500">
                    {t("userBorrows.noCover")}
                  </div>
                )}
              </div>

              <div className="p-4 flex-grow">
                <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-1">
                  {borrow.book.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  {borrow.book.authors.map((a) => a.name).join(", ")}
                </p>

                <div className="mt-3 space-y-1 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{t("userBorrows.borrowedLabel")}</span>{" "}
                    {new Date(borrow.borrowedAt).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{t("userBorrows.dueLabel")}</span>{" "}
                    {new Date(borrow.dueDate).toLocaleDateString()}
                  </p>
                  {borrow.returnedAt && (
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{t("userBorrows.returnedLabel")}</span>{" "}
                      {new Date(borrow.returnedAt).toLocaleDateString()}
                    </p>
                  )}

                  <p
                    className={`font-medium ${
                      borrow.status === "OVERDUE"
                        ? "text-red-600 dark:text-red-400"
                        : borrow.returnedAt
                        ? "text-green-600 dark:text-green-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {t("userBorrows.statusLabel")}{" "}
                    {borrow.status === "OVERDUE"
                      ? t("borrows.OVERDUE")
                      : borrow.returnedAt
                      ? t("borrows.RETURNED")
                      : t("userBorrows.statusActive")}
                  </p>
                </div>
              </div>

              {!borrow.returnedAt && (
                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleReturnBook(borrow.id)}
                    disabled={returningBorrowId === borrow.id || isReturnQueued(borrow.id)}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isReturnQueued(borrow.id)
                      ? t("userBorrows.returningSync")
                      : returningBorrowId === borrow.id
                      ? t("borrows.processing")
                      : t("userBorrows.returnBook")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserBorrows;
