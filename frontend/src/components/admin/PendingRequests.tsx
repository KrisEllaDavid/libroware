import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import Modal from '../Modal';

// GraphQL queries and mutations
const GET_PENDING_BORROWS = gql`
  query GetPendingBorrows {
    borrows(status: BORROWED) {
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
      status
    }
  }
`;

// Add query without status filter as fallback
const GET_ALL_BORROWS = gql`
  query GetAllBorrows {
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
      status
    }
  }
`;

const UPDATE_BORROW = gql`
  mutation UpdateBorrow($id: ID!, $input: BorrowUpdateInput!) {
    updateBorrow(id: $id, input: $input) {
      id
      status
      returnedAt
    }
  }
`;

const RETURN_BOOK = gql`
  mutation ReturnBook($id: ID!) {
    returnBook(id: $id) {
      id
      status
      returnedAt
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
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE';
};

const PendingRequests: React.FC = () => {
  const [selectedBorrow, setSelectedBorrow] = useState<Borrow | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [useFallbackQuery, setUseFallbackQuery] = useState(false);
  
  console.log('🔄 PendingRequests component rendered');
  
  // Fetch pending borrows with primary query
  const { 
    loading: primaryLoading, 
    error: primaryError, 
    data: primaryData, 
    refetch: primaryRefetch 
  } = useQuery(GET_PENDING_BORROWS, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    skip: useFallbackQuery,
    onError: (error: any) => {
      console.error('❌ Error fetching pending borrows with primary query:', error);
      setUseFallbackQuery(true);
    }
  });
  
  // Fallback query for all borrows
  const { 
    loading: fallbackLoading, 
    error: fallbackError, 
    data: fallbackData, 
    refetch: fallbackRefetch 
  } = useQuery(GET_ALL_BORROWS, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    skip: !useFallbackQuery,
    onCompleted: (data: { borrows: Borrow[] }) => {
      console.log('✅ Successfully fetched borrows with fallback query:', data?.borrows?.length || 0, 'items');
    }
  });
  
  // Consolidated values
  const loading = useFallbackQuery ? fallbackLoading : primaryLoading;
  const error = useFallbackQuery ? fallbackError : primaryError;
  const data = useFallbackQuery ? fallbackData : primaryData;
  const refetch = useFallbackQuery ? fallbackRefetch : primaryRefetch;
  
  // Update borrows state when data changes
  useEffect(() => {
    try {
      if (data && data.borrows) {
        console.log('📊 Setting borrows state with', data.borrows.length, 'items');
        
        // Filter to only show borrowed books if using fallback query
        if (useFallbackQuery) {
          const borrowedBooks = data.borrows.filter(
            (borrow: Borrow) => borrow.status === 'BORROWED' || borrow.status === 'OVERDUE'
          );
          setBorrows(borrowedBooks);
        } else {
          setBorrows(data.borrows);
        }
      }
    } catch (error: any) {
      console.error('❌ Error updating borrows state:', error);
    }
  }, [data, useFallbackQuery]);
  
  // Mutations
  const [returnBook, { loading: returnLoading }] = useMutation(RETURN_BOOK, {
    onCompleted: () => {
      console.log('✅ Book return completed successfully');
      setIsReturnModalOpen(false);
      setSelectedBorrow(null);
      refetch();
    },
    onError: (error: any) => {
      console.error('❌ Error returning book:', error);
    }
  });
  
  // Handle return book
  const handleReturn = (borrow: Borrow) => {
    console.log('🔄 Handling return for book:', borrow.book.title);
    setSelectedBorrow(borrow);
    setIsReturnModalOpen(true);
  };
  
  // Confirm return
  const confirmReturn = () => {
    if (selectedBorrow) {
      console.log('🔄 Confirming return for borrow ID:', selectedBorrow.id);
      returnBook({
        variables: {
          id: selectedBorrow.id
        }
      });
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  // Check if a book is overdue
  const isOverdue = (dueDate: string) => {
    const today = new Date();
    const bookDueDate = new Date(dueDate);
    return today > bookDueDate;
  };
  
  // Safe version of getFilteredBorrows that won't crash if borrows is undefined
  const getFilteredBorrows = () => {
    if (!borrows || !Array.isArray(borrows)) {
      console.log('⚠️ Borrows is not available or not an array:', borrows);
      return [];
    }
    
    console.log('🔍 Filtering', borrows.length, 'borrows with search term:', searchTerm);
    
    return borrows.filter((borrow: Borrow) => {
      const matchesSearch = searchTerm === '' || 
        borrow.book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrow.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrow.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrow.user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  };
  
  let filteredBorrows: Borrow[] = [];
  try {
    filteredBorrows = getFilteredBorrows();
  } catch (error) {
    console.error('❌ Error filtering borrows:', error);
  }
  
  const renderContent = () => {
    // Always render something even if there's an error
    try {
      if (error) {
        console.error('❌ GraphQL error in PendingRequests:', error);
        return (
          <div className="p-6 text-center">
            <div className="text-red-500 mb-2">Error loading pending requests:</div>
            <pre className="text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded text-red-700 dark:text-red-300 overflow-auto max-h-40">
              {error.message}
            </pre>
            <button
              onClick={() => {
                // Try fallback query if primary query fails
                if (!useFallbackQuery) {
                  setUseFallbackQuery(true);
                } else {
                  refetch();
                }
              }}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
            >
              Try Again
            </button>
          </div>
        );
      }

      if (loading) {
        return (
          <div className="p-6 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent align-[-0.125em]" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 transition-colors">
              {useFallbackQuery 
                ? "Loading all borrows (fallback)..." 
                : "Loading pending requests..."}
            </p>
          </div>
        );
      }

      const hasFilteredBorrows = filteredBorrows && filteredBorrows.length > 0;
      
      if (!hasFilteredBorrows) {
        return (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
              {searchTerm 
                ? "No requests match your search." 
                : useFallbackQuery 
                  ? "No pending borrow requests found in all borrows." 
                  : "No pending borrow requests found."}
            </p>
            {useFallbackQuery && (
              <button
                onClick={() => {
                  setUseFallbackQuery(false);
                  primaryRefetch();
                }}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
              >
                Try Original Query
              </button>
            )}
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
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
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
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`text-sm ${isOverdue(borrow.dueDate) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                      {formatDate(borrow.dueDate)}
                      {isOverdue(borrow.dueDate) && ' (overdue)'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${isOverdue(borrow.dueDate) ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                      {isOverdue(borrow.dueDate) ? 'Overdue' : 'Borrowed'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleReturn(borrow)}
                      disabled={returnLoading}
                      className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 disabled:opacity-50"
                    >
                      Return
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } catch (err) {
      console.error('Unexpected error in renderContent:', err);
      // Fallback minimal rendering to avoid breaking the entire page
      return (
        <div className="p-6 text-center">
          <p className="text-red-500">An unexpected error occurred. Please try again later.</p>
        </div>
      );
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow dark:bg-gray-800 dark:border dark:border-gray-700 sm:rounded-md transition-colors">
        <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6 flex flex-col sm:flex-row justify-between sm:items-center space-y-4 sm:space-y-0">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white transition-colors">
            Pending Borrow Requests
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
          </div>
        </div>
        
        {renderContent()}
      </div>
      
      {/* Return Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        title="Return Book"
        message={`Are you sure you want to mark the book "${selectedBorrow?.book.title}" as returned by ${selectedBorrow?.user.firstName} ${selectedBorrow?.user.lastName}?`}
        confirmText={returnLoading ? "Processing..." : "Return Book"}
        cancelText="Cancel"
        onConfirm={confirmReturn}
        onCancel={() => setIsReturnModalOpen(false)}
        type="warning"
      />
    </div>
  );
};

export default PendingRequests;