import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { useAuth } from "../../context/AuthContext";
import UserActivity from "./UserActivity";
import UserBorrows from "./UserBorrows";
import BorrowStatistics from "./BorrowStatistics";
import UserBookView from "./UserBookView";

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

// Types for user statistics
interface UserStats {
  totalBorrows: number;
  activeBorrows: number;
  overdueBorrows: number;
  returnedBooks: number;
  favoriteCategory: string | null;
}

// Define tabs
enum Tab {
  DASHBOARD = "dashboard",
  MY_BOOKS = "my-books",
  MY_REQUESTS = "my-requests",
  BROWSE_BOOKS = "browse-books",
}

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [userStats, setUserStats] = useState<UserStats>({
    totalBorrows: 0,
    activeBorrows: 0,
    overdueBorrows: 0,
    returnedBooks: 0,
    favoriteCategory: null,
  });

  // Query borrows for this user
  const {
    data: borrowsData,
    loading: borrowsLoading,
    error: borrowsError,
    refetch,
  } = useQuery(GET_USER_BORROWS, {
    variables: { userId: user?.id },
    skip: !user?.id,
    fetchPolicy: "network-only",
  });

  // Process borrow data to calculate statistics
  useEffect(() => {
    if (borrowsData?.userBorrows) {
      const borrows = borrowsData.userBorrows;

      // Count active and overdue borrows
      const activeBorrows = borrows.filter(
        (b: any) => b.status === "BORROWED" && !b.returnedAt
      ).length;
      const overdueBorrows = borrows.filter(
        (b: any) => b.status === "OVERDUE"
      ).length;
      const returnedBooks = borrows.filter((b: any) => b.returnedAt).length;

      // Determine favorite category (most frequently borrowed category)
      const categoryMap = new Map<string, number>();

      borrows.forEach((borrow: any) => {
        if (borrow.book && borrow.book.categories) {
          borrow.book.categories.forEach((category: any) => {
            categoryMap.set(
              category.name,
              (categoryMap.get(category.name) || 0) + 1
            );
          });
        }
      });

      // Find the most frequent category
      let favoriteCategory = null;
      let maxCount = 0;

      categoryMap.forEach((count, category) => {
        if (count > maxCount) {
          maxCount = count;
          favoriteCategory = category;
        }
      });

      setUserStats({
        totalBorrows: borrows.length,
        activeBorrows,
        overdueBorrows,
        returnedBooks,
        favoriteCategory,
      });
    }
  }, [borrowsData]);

  // Format borrows data for BorrowStatistics component
  const getFormattedBorrows = () => {
    if (!borrowsData?.userBorrows) return [];

    return borrowsData.userBorrows.map((borrow: any) => ({
      id: borrow.id,
      borrowDate: borrow.borrowedAt,
      returnDate: borrow.returnedAt,
      book: {
        id: borrow.book.id,
        title: borrow.book.title,
        categories: borrow.book.categories,
      },
    }));
  };

  // Format borrows data for UserBorrows component
  const getFormattedUserBorrows = () => {
    if (!borrowsData?.userBorrows) return [];

    return borrowsData.userBorrows.map((borrow: any) => ({
      id: borrow.id,
      book: {
        id: borrow.book.id,
        title: borrow.book.title,
        isbn: borrow.book.isbn,
        authors: borrow.book.authors,
        coverImage: borrow.book.coverImage,
      },
      borrowedAt: borrow.borrowedAt,
      dueDate: borrow.dueDate,
      returnedAt: borrow.returnedAt,
      status: borrow.status,
    }));
  };

  // Handle tab change
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const renderTabButton = (tab: Tab, label: string) => {
    return (
      <button
        key={tab}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
          activeTab === tab
            ? "bg-emerald-600 text-white shadow-md"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
        onClick={() => handleTabChange(tab)}
      >
        {label}
      </button>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case Tab.DASHBOARD:
        return (
          <div className="mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Your Overview</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Total Borrows
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats.totalBorrows}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Overdue
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {userStats.overdueBorrows}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Returned Books
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {userStats.returnedBooks}
                  </div>
                </div>
              </div>

              {userStats.favoriteCategory && (
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <span className="font-medium">Favorite Category:</span>{" "}
                  {userStats.favoriteCategory}
                </div>
              )}
            </div>

            <BorrowStatistics borrows={getFormattedBorrows()} />
          </div>
        );

      case Tab.MY_BOOKS:
        return (
          <div className="mt-6">
            <UserBorrows
              userId={user?.id || ""}
              borrows={getFormattedUserBorrows()}
              loading={borrowsLoading}
              error={borrowsError}
              refetch={refetch}
            />
          </div>
        );

      case Tab.MY_REQUESTS:
        return (
          <div className="mt-6">
            <UserActivity />
          </div>
        );

      case Tab.BROWSE_BOOKS:
        return (
          <div className="mt-6">
            <UserBookView />
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8 text-red-500">
        You must be logged in to view this page
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold mb-6">User Dashboard</h1>

      <div className="flex overflow-x-auto pb-2 mb-4 space-x-2">
        {renderTabButton(Tab.DASHBOARD, "Dashboard")}
        {renderTabButton(Tab.MY_BOOKS, "My Books")}
        {renderTabButton(Tab.MY_REQUESTS, "My Requests")}
        {renderTabButton(Tab.BROWSE_BOOKS, "Browse Books")}
      </div>

      {renderTabContent()}
    </div>
  );
};

export default UserDashboard;
