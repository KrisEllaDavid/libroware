import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { GET_USER, GET_BORROWS } from '../graphql/queries';
import BorrowStatistics from './user/BorrowStatistics';
import MyBorrows from './user/MyBorrows';
import AvailableBooks from './user/AvailableBooks';

enum Tab {
  DASHBOARD = 'dashboard',
  MY_BORROWS = 'myBorrows',
  BROWSE_BOOKS = 'browseBooks',
}

interface UserStats {
  totalBorrows: number;
  activeBorrows: number;
  overdueBorrows: number;
  returnedBooks: number;
  favoriteCategory: string | null;
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

  // Query user data with borrow history
  const { data: userData, loading: userLoading } = useQuery(GET_USER, {
    variables: { id: user?.id },
    skip: !user?.id,
    fetchPolicy: 'network-only',
  });

  // Query borrows for this user
  const { data: borrowsData, loading: borrowsLoading } = useQuery(GET_BORROWS, {
    variables: { userId: user?.id },
    skip: !user?.id,
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (userData?.user && userData.user.borrowedBooks) {
      const borrowed = userData.user.borrowedBooks;
      
      // Count active and overdue borrows
      const activeBorrows = borrowed.filter(b => b.status === 'BORROWED').length;
      const overdueBorrows = borrowed.filter(b => b.status === 'OVERDUE').length;
      const returnedBooks = borrowed.filter(b => b.status === 'RETURNED').length;
      
      // Determine favorite category (most frequently borrowed category)
      const categoryMap = new Map<string, number>();
      
      // If we have detailed book info with categories
      if (borrowsData && borrowsData.userBorrows) {
        borrowsData.userBorrows.forEach(borrow => {
          if (borrow.book && borrow.book.categories) {
            borrow.book.categories.forEach(category => {
              categoryMap.set(category.name, (categoryMap.get(category.name) || 0) + 1);
            });
          }
        });
      }
      
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
        totalBorrows: borrowed.length,
        activeBorrows,
        overdueBorrows,
        returnedBooks,
        favoriteCategory,
      });
    }
  }, [userData, borrowsData]);

  const renderTabContent = () => {
    switch (activeTab) {
      case Tab.DASHBOARD:
        return <BorrowStatistics stats={userStats} />;
      case Tab.MY_BORROWS:
        return <MyBorrows />;
      case Tab.BROWSE_BOOKS:
        return <AvailableBooks />;
      default:
        return <BorrowStatistics stats={userStats} />;
    }
  };

  if (userLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-emerald-600 dark:text-emerald-400 text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Library Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Welcome back, {user?.firstName}! Here's your reading activity and borrowed books.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex -mb-px" aria-label="Tabs">
          <button
            onClick={() => setActiveTab(Tab.DASHBOARD)}
            className={`${
              activeTab === Tab.DASHBOARD
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            } py-4 px-6 border-b-2 font-medium text-sm transition-colors`}
          >
            Dashboard
          </button>
          
          <button
            onClick={() => setActiveTab(Tab.MY_BORROWS)}
            className={`${
              activeTab === Tab.MY_BORROWS
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            } py-4 px-6 border-b-2 font-medium text-sm transition-colors`}
          >
            My Borrows
          </button>
          
          <button
            onClick={() => setActiveTab(Tab.BROWSE_BOOKS)}
            className={`${
              activeTab === Tab.BROWSE_BOOKS
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            } py-4 px-6 border-b-2 font-medium text-sm transition-colors`}
          >
            Browse Books
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-200">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default UserDashboard;