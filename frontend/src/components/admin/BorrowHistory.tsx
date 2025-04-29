import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

// GraphQL queries
const GET_BORROWS = gql`
  query GetAllBorrows($status: BorrowStatus) {
    borrows(status: $status) {
      id
      user {
        id
        firstName
        lastName
        email
      }
      book {
        id
        title
        isbn
        authors {
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

// Fallback query without status filter
const GET_ALL_BORROWS = gql`
  query GetAllBorrowsNoFilter {
    borrows {
      id
      user {
        id
        firstName
        lastName
        email
      }
      book {
        id
        title
        isbn
        authors {
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

type Borrow = {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  book: {
    id: string;
    title: string;
    isbn: string;
    authors: {
      name: string;
    }[];
  };
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE';
};

const BorrowHistory: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'returned' | 'active'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [useFallbackQuery, setUseFallbackQuery] = useState(false);
  
  // Get borrows based on status filter
  const status = filter === 'returned' ? 'RETURNED' : 
                filter === 'active' ? 'BORROWED' : undefined;
  
  // Fetch borrow history with status filter
  const { 
    loading: primaryLoading, 
    error: primaryError, 
    data: primaryData,
    refetch: primaryRefetch
  } = useQuery(GET_BORROWS, {
    variables: { status },
    fetchPolicy: 'network-only',
    skip: useFallbackQuery
  });

  // Fallback query without status filter
  const { 
    loading: fallbackLoading, 
    error: fallbackError, 
    data: fallbackData,
    refetch: fallbackRefetch
  } = useQuery(GET_ALL_BORROWS, {
    fetchPolicy: 'network-only',
    skip: !useFallbackQuery
  });

  // Determine loading, error and data states
  const loading = useFallbackQuery ? fallbackLoading : primaryLoading;
  const error = useFallbackQuery ? fallbackError : primaryError;
  const data = useFallbackQuery ? fallbackData : primaryData;
  
  // Update borrows state when data changes
  useEffect(() => {
    if (data && data.borrows) {
      let filteredData = [...data.borrows];
      
      // If using fallback query, filter the data based on the selected filter
      if (useFallbackQuery && status) {
        filteredData = data.borrows.filter((borrow: Borrow) => borrow.status === status);
      }
      
      setBorrows(filteredData);
    }
  }, [data, useFallbackQuery, status]);
  
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  // Filter borrows based on search term
  const getFilteredBorrows = () => {
    if (!borrows) return [];
    
    return borrows.filter((borrow: Borrow) => {
      const matchesSearch = searchTerm === '' || 
        borrow.book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrow.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrow.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrow.user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  };

  const filteredBorrows = getFilteredBorrows();
  
  const renderContent = () => {
    try {
      if (loading || fallbackLoading) {
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin mb-2">
              <svg className="h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              {useFallbackQuery 
                ? "Loading fallback data..." 
                : "Loading borrow history..."}
            </p>
          </div>
        );
      }

      if (error || fallbackError) {
        const currentError = error || fallbackError;
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <svg className="h-12 w-12 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-1">Error Loading Data</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {currentError?.message || "Failed to load borrow history."}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => useFallbackQuery ? fallbackRefetch() : primaryRefetch()}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
              >
                Try Again
              </button>
              {!useFallbackQuery && (
                <button
                  onClick={() => setUseFallbackQuery(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                >
                  Use Fallback Query
                </button>
              )}
              {useFallbackQuery && (
                <button
                  onClick={() => {
                    setUseFallbackQuery(false);
                    primaryRefetch();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                >
                  Try Original Query
                </button>
              )}
            </div>
          </div>
        );
      }

      const filteredBorrows = getFilteredBorrows();

      if (filteredBorrows.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <svg className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Borrows Found</h3>
            {searchTerm ? (
              <p className="text-gray-500 dark:text-gray-400 mb-4">No results matching "{searchTerm}". Try a different search term.</p>
            ) : filter !== 'all' ? (
              <p className="text-gray-500 dark:text-gray-400 mb-4">No {filter === 'active' ? 'active' : 'returned'} borrows found.</p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 mb-4">There are no borrow records in the system yet.</p>
            )}
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                >
                  Clear Search
                </button>
              )}
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                >
                  View All Borrows
                </button>
              )}
              {useFallbackQuery && (
                <button
                  onClick={() => {
                    setUseFallbackQuery(false);
                    primaryRefetch();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                >
                  Try Original Query
                </button>
              )}
              <button
                onClick={() => useFallbackQuery ? fallbackRefetch() : primaryRefetch()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              >
                Refresh Data
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Book
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Borrowed Date
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Returned Date
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {filteredBorrows.map((borrow: Borrow) => (
                <tr key={borrow.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{borrow.book.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">ISBN: {borrow.book.isbn}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {borrow.book.authors.map(author => author.name).join(', ')}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {borrow.user.firstName} {borrow.user.lastName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{borrow.user.email}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(borrow.borrowedAt)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(borrow.dueDate)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(borrow.returnedAt)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      borrow.status === 'RETURNED' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : borrow.status === 'OVERDUE'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {borrow.status === 'RETURNED' 
                        ? 'Returned' 
                        : borrow.status === 'OVERDUE' 
                          ? 'Overdue' 
                          : 'Borrowed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } catch (err) {
      console.error('Unexpected error in renderContent:', err);
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <svg className="h-12 w-12 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-1">Unexpected Error</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Something went wrong while displaying borrow history.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
          >
            Reload Page
          </button>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow dark:bg-gray-800 dark:border dark:border-gray-700 sm:rounded-md transition-colors">
        <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6 flex flex-col sm:flex-row justify-between sm:items-center space-y-4 sm:space-y-0">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white transition-colors">
            Borrow History {useFallbackQuery && <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-2 py-1 rounded-full ml-2">Using Fallback</span>}
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search books or users..."
                className="input w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-auto flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'all'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                } transition-colors`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'active'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                } transition-colors`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('returned')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'returned'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                } transition-colors`}
              >
                Returned
              </button>
            </div>
          </div>
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
};

export default BorrowHistory;