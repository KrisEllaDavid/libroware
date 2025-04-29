import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_BOOKS, GET_AUTHORS, GET_CATEGORIES, GET_USERS, GET_BORROWS } from '../../graphql/queries';
import DashboardStats from './DashboardStats';

// Define types for our data structures
interface Book {
  id: string;
  title: string;
  quantity: number;
  available: number;
  categories: Array<{ id: string; name: string }>;
}

interface User {
  id: string;
  role: string;
}

interface Borrow {
  id: string;
  borrowedAt: string;
  returnedAt: string | null;
  user: {
    id: string;
  };
}

interface CategoryStat {
  name: string;
  count: number;
}

interface BookStat {
  title: string;
  borrowCount: number;
}

interface MonthlyActivity {
  month: string;
  borrows: number;
  returns: number;
}

interface RoleStat {
  role: string;
  count: number;
}

interface DashboardDataType {
  bookStats: {
    total: number;
    available: number;
    borrowed: number;
    categories: CategoryStat[];
    topBooks: BookStat[];
    monthlyActivity: MonthlyActivity[];
  };
  userStats: {
    total: number;
    active: number;
    byRole: RoleStat[];
  };
}

const Dashboard: React.FC = () => {
  // GraphQL queries
  const { data: booksData, loading: booksLoading } = useQuery(GET_BOOKS, {
    variables: { skip: 0, take: 100 }
  });

  const { data: authorsData, loading: authorsLoading } = useQuery(GET_AUTHORS, {
    variables: { skip: 0, take: 100 }
  });

  const { data: categoriesData, loading: categoriesLoading } = useQuery(GET_CATEGORIES, {
    variables: { skip: 0, take: 100 }
  });

  const { data: usersData, loading: usersLoading } = useQuery(GET_USERS, {
    variables: { skip: 0, take: 100 }
  });

  const { data: borrowsData, loading: borrowsLoading } = useQuery(GET_BORROWS, {
    variables: { skip: 0, take: 100 }
  });

  // Process data for dashboard stats
  const [dashboardData, setDashboardData] = useState<DashboardDataType>({
    bookStats: {
      total: 0,
      available: 0,
      borrowed: 0,
      categories: [],
      topBooks: [],
      monthlyActivity: []
    },
    userStats: {
      total: 0,
      active: 0,
      byRole: []
    }
  });

  useEffect(() => {
    if (booksData && authorsData && categoriesData && usersData && borrowsData) {
      // Process books data
      const books: Book[] = booksData.books || [];
      const borrowed = books.reduce((sum: number, book: Book) => sum + (book.quantity - book.available), 0);
      
      // Calculate categories distribution
      const categoriesMap = new Map<string, number>();
      books.forEach((book: Book) => {
        book.categories.forEach((category) => {
          if (categoriesMap.has(category.name)) {
            categoriesMap.set(category.name, categoriesMap.get(category.name)! + 1);
          } else {
            categoriesMap.set(category.name, 1);
          }
        });
      });
      
      const categoriesDistribution: CategoryStat[] = Array.from(categoriesMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Calculate top borrowed books (using borrowed count from data)
      const topBooks: BookStat[] = [...books]
        .sort((a, b) => (b.quantity - b.available) - (a.quantity - a.available))
        .slice(0, 5)
        .map(book => ({ 
          title: book.title, 
          borrowCount: (book.quantity - book.available) 
        }));

      // Process monthly activity from borrows data
      const borrows: Borrow[] = borrowsData.borrows || [];
      const monthlyActivity = processMonthlyActivity(borrows);
      
      // Process users data
      const users: User[] = usersData.users || [];
      
      // Count active users (those who have borrowed books in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get unique user IDs from recent borrows
      const activeUserIds = new Set<string>();
      borrows.forEach((borrow: Borrow) => {
        const borrowDate = new Date(borrow.borrowedAt);
        if (borrowDate >= thirtyDaysAgo) {
          activeUserIds.add(borrow.user.id);
        }
      });
      
      // Calculate user role distribution
      const userRoles = new Map<string, number>();
      users.forEach((user: User) => {
        if (userRoles.has(user.role)) {
          userRoles.set(user.role, userRoles.get(user.role)! + 1);
        } else {
          userRoles.set(user.role, 1);
        }
      });
      
      const roleDistribution: RoleStat[] = Array.from(userRoles.entries())
        .map(([role, count]) => ({ role, count }));
      
      setDashboardData({
        bookStats: {
          total: books.length,
          available: books.reduce((sum: number, book: Book) => sum + book.available, 0),
          borrowed,
          categories: categoriesDistribution,
          topBooks,
          monthlyActivity
        },
        userStats: {
          total: users.length,
          active: activeUserIds.size,
          byRole: roleDistribution
        }
      });
    }
  }, [booksData, authorsData, categoriesData, usersData, borrowsData]);

  // Helper function to process monthly activity
  const processMonthlyActivity = (borrows: Borrow[]): MonthlyActivity[] => {
    const currentYear = new Date().getFullYear();
    const monthMap = new Map<string, number>();
    const returnMap = new Map<string, number>();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months
    months.forEach(month => {
      monthMap.set(month, 0);
      returnMap.set(month, 0);
    });
    
    // Count borrows by month (only include current year)
    borrows.forEach(borrow => {
      const date = new Date(borrow.borrowedAt);
      
      // Only include current year data
      if (date.getFullYear() === currentYear) {
        const month = months[date.getMonth()];
        monthMap.set(month, monthMap.get(month)! + 1);
      
        // Count returns for current year
        if (borrow.returnedAt) {
          const returnDate = new Date(borrow.returnedAt);
          if (returnDate.getFullYear() === currentYear) {
            const returnMonth = months[returnDate.getMonth()];
            returnMap.set(returnMonth, returnMap.get(returnMonth)! + 1);
          }
        }
      }
    });
    
    // Convert to array
    return months.map(month => ({
      month,
      borrows: monthMap.get(month)!,
      returns: returnMap.get(month)!
    }));
  };

  // Show loading state
  if (booksLoading || authorsLoading || categoriesLoading || usersLoading || borrowsLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-emerald-600 dark:text-emerald-400 text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Library Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome to your library management dashboard</p>
      </div>

      {/* Dashboard stats */}
      <DashboardStats
        bookStats={dashboardData.bookStats}
        userStats={dashboardData.userStats}
      />
    </div>
  );
};

export default Dashboard; 