import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { RETURN_BOOK } from '../../graphql/mutations';
import { USER_BORROWS } from '../../graphql/queries';

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

const UserBorrows: React.FC<UserBorrowsProps> = ({ userId, borrows = [], loading, error, refetch }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'returned'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [returnBook, { loading: returningBook }] = useMutation(RETURN_BOOK, {
    onCompleted: () => {
      refetch();
    },
    onError: (error: any) => {
      console.error('Error returning book:', error);
    },
    refetchQueries: [{ query: USER_BORROWS, variables: { userId } }]
  });

  const handleReturnBook = (borrowId: string) => {
    returnBook({ variables: { id: borrowId } });
  };

  const filteredBorrows = borrows.filter(borrow => {
    // Apply status filter
    if (filter === 'active' && borrow.returnedAt !== null) return false;
    if (filter === 'returned' && borrow.returnedAt === null) return false;
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      return (
        borrow.book.title.toLowerCase().includes(searchLower) ||
        borrow.book.isbn.toLowerCase().includes(searchLower) ||
        borrow.book.authors.some(author => 
          author.name.toLowerCase().includes(searchLower)
        )
      );
    }
    
    return true;
  });

  if (loading) return <div className="text-center py-4">Loading your borrows...</div>;
  if (error) return <div className="text-red-500 py-4">Error loading borrows: {error.message}</div>;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3 sm:mb-0">My Books</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search books..."
              className="pl-8 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                filter === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 text-sm font-medium border-t border-b ${
                filter === 'active'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('returned')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
                filter === 'returned'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Returned
            </button>
          </div>
        </div>
      </div>
      
      {filteredBorrows.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchTerm ? "No books match your search." : "You haven't borrowed any books yet."}
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
                  <div className="text-gray-400 dark:text-gray-500">No cover available</div>
                )}
              </div>
              
              <div className="p-4 flex-grow">
                <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-1">{borrow.book.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  {borrow.book.authors.map(a => a.name).join(', ')}
                </p>
                
                <div className="mt-3 space-y-1 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Borrowed:</span> {new Date(borrow.borrowedAt).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Due:</span> {new Date(borrow.dueDate).toLocaleDateString()}
                  </p>
                  {borrow.returnedAt && (
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Returned:</span> {new Date(borrow.returnedAt).toLocaleDateString()}
                    </p>
                  )}
                  
                  <p className={`font-medium ${
                    borrow.status === 'OVERDUE' 
                      ? 'text-red-600 dark:text-red-400' 
                      : borrow.returnedAt 
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    Status: {borrow.status === 'OVERDUE' ? 'Overdue' : borrow.returnedAt ? 'Returned' : 'Active'}
                  </p>
                </div>
              </div>
              
              {!borrow.returnedAt && (
                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleReturnBook(borrow.id)}
                    disabled={returningBook}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {returningBook ? 'Processing...' : 'Return Book'}
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