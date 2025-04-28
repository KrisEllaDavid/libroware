import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

// GraphQL queries
const GET_USER_BORROWS = gql`
  query GetUserBorrows($userId: ID!) {
    userBorrows(userId: $userId) {
      id
      book {
        id
        title
        isbn
        coverImage
        authors {
          name
        }
        categories {
          name
        }
      }
      borrowedAt
      dueDate
      returnedAt
      status
    }
  }
`;

// Types
type Borrow = {
  id: string;
  book: {
    id: string;
    title: string;
    isbn: string;
    coverImage: string | null;
    authors: {
      name: string;
    }[];
    categories: {
      name: string;
    }[];
  };
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: "BORROWED" | "RETURNED" | "OVERDUE";
};

const UserActivity: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const { t } = useTranslation();

  // Fetch user borrows
  const { loading, error, data } = useQuery(GET_USER_BORROWS, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading)
    return (
      <div className="flex justify-center py-8">Loading your activity...</div>
    );
  if (error)
    return (
      <div className="text-red-500">
        Error loading your activity: {error.message}
      </div>
    );

  const borrows = data?.userBorrows || [];

  // Filter borrows based on status
  const pendingBorrows = borrows.filter(
    (borrow: Borrow) => borrow.status === "BORROWED" && !borrow.returnedAt
  );

  const historyBorrows = borrows.filter(
    (borrow: Borrow) => borrow.status === "RETURNED" || borrow.returnedAt
  );

  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("bookRequests.title")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("bookRequests.pending")} / {t("bookRequests.history")}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("pending")}
            className={`${
              activeTab === "pending"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            aria-current={activeTab === "pending" ? "page" : undefined}
          >
            {t("bookRequests.pending")}
            {pendingBorrows.length > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium 
                ${
                  activeTab === "pending"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                {pendingBorrows.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`${
              activeTab === "history"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            aria-current={activeTab === "history" ? "page" : undefined}
          >
            {t("bookRequests.history")}
            {historyBorrows.length > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium 
                ${
                  activeTab === "history"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                {historyBorrows.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === "pending" && (
          <>
            {pendingBorrows.length === 0 ? (
              <div className="text-center py-10">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No pending requests
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  You don't have any pending book requests at the moment.
                </p>
                <div className="mt-6">
                  <a
                    href="/books"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    Browse Library
                  </a>
                </div>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Book
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Request Date
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Due Date
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {pendingBorrows.map((borrow: Borrow) => (
                      <tr key={borrow.id}>
                        <td className="px-4 py-4 whitespace-normal">
                          <div className="flex items-center">
                            {borrow.book.coverImage ? (
                              <img
                                src={borrow.book.coverImage}
                                alt={borrow.book.title}
                                className="w-10 h-14 object-cover rounded-sm mr-3 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-14 bg-gray-200 dark:bg-gray-700 rounded-sm mr-3 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs flex-shrink-0">
                                No image
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white break-words">
                                {borrow.book.title}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 break-words">
                                {borrow.book.authors
                                  .map((author) => author.name)
                                  .join(", ")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(borrow.borrowedAt)}
                        </td>
                        <td className="px-4 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(borrow.dueDate)}
                        </td>
                        <td className="px-4 py-4 whitespace-normal">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            Pending Approval
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === "history" && (
          <>
            {historyBorrows.length === 0 ? (
              <div className="text-center py-10">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No request history
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  You haven't made any book requests yet.
                </p>
                <div className="mt-6">
                  <a
                    href="/books"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    Browse Library
                  </a>
                </div>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Book
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Requested Date
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Returned Date
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {historyBorrows.map((borrow: Borrow) => (
                      <tr key={borrow.id}>
                        <td className="px-4 py-4 whitespace-normal">
                          <div className="flex items-center">
                            {borrow.book.coverImage ? (
                              <img
                                src={borrow.book.coverImage}
                                alt={borrow.book.title}
                                className="w-10 h-14 object-cover rounded-sm mr-3 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-14 bg-gray-200 dark:bg-gray-700 rounded-sm mr-3 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs flex-shrink-0">
                                No image
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white break-words">
                                {borrow.book.title}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 break-words">
                                {borrow.book.authors
                                  .map((author) => author.name)
                                  .join(", ")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(borrow.borrowedAt)}
                        </td>
                        <td className="px-4 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(borrow.returnedAt)}
                        </td>
                        <td className="px-4 py-4 whitespace-normal">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserActivity;
