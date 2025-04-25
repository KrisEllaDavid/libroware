import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { useAuth } from '../../context/AuthContext';
import Modal from '../Modal';

// GraphQL queries and mutations
const GET_BOOKS = gql`
  query GetBooks {
    books {
      id
      title
      isbn
      description
      quantity
      available
      coverImage
      authors {
        id
        name
      }
      categories {
        id
        name
      }
    }
  }
`;

const CREATE_BORROW = gql`
  mutation CreateBorrow($input: BorrowCreateInput!) {
    createBorrow(input: $input) {
      id
      status
      borrowedAt
      dueDate
      book {
        id
        title
      }
    }
  }
`;

// Types
interface Book {
  id: string;
  title: string;
  isbn: string;
  description: string | null;
  quantity: number;
  available: number;
  coverImage: string | null;
  authors: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

interface BorrowInput {
  userId: string;
  bookId: string;
  note?: string;
  dueDate: string;
}

const UserBookView: React.FC = () => {
  const { user } = useAuth();

  // Helper functions defined before using them in state initialization
  // Calculate due date with customizable days from today
  const getDueDate = (days = 7) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0]; // returns YYYY-MM-DD format for date inputs
  };
  
  // Get min and max allowed dates for borrowing
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    return twoWeeksLater.toISOString().split('T')[0];
  };
  
  // State declarations
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [borrowType, setBorrowType] = useState<'BORROW' | 'READ'>('BORROW');
  const [note, setNote] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedDueDate, setSelectedDueDate] = useState<Date>(new Date(getDueDate(7)));

  // Query for books data
  const { loading, error, data, refetch } = useQuery(GET_BOOKS);

  // Create borrow mutation
  const [createBorrow, { loading: borrowLoading }] = useMutation(CREATE_BORROW, {
    onCompleted: () => {
      setShowModal(false);
      setSelectedBook(null);
      setBorrowType('BORROW');
      setNote('');
      refetch(); // Refresh the book list
    },
    onError: (error: any) => {
      setSubmitError(error.message);
    }
  });

  // Handle book selection
  const handleBookSelect = (book: Book, type: 'BORROW' | 'READ') => {
    setSelectedBook(book);
    setBorrowType(type);
    setShowModal(true);
    setSubmitError('');
    
    // Reset due date to default (7 days from now) when opening modal
    const defaultDueDate = new Date(getDueDate(7));
    setSelectedDueDate(defaultDueDate);
  };

  // Handle borrow submission
  const handleSubmit = () => {
    if (!user?.id || !selectedBook) return;

    // Get the due date from the input for BORROW type
    const dueDate = new Date();
    if (borrowType === 'BORROW') {
      // Use the selected due date or default to 7 days
      dueDate.setTime(selectedDueDate.getTime());
    } else {
      // Set due date to today for reading (same day return)
      dueDate.setHours(23, 59, 59, 999);
    }

    const input: BorrowInput = {
      userId: user.id,
      bookId: selectedBook.id,
      note: note.trim() || undefined,
      dueDate: dueDate.toISOString()
    };

    console.log('Submitting borrow request:', input);
    createBorrow({ variables: { input } });
  };

  // Filter and sort books
  const getFilteredBooks = () => {
    if (!data || !data.books) return [];

    return data.books
      .filter((book: Book) => {
        // Filter by search term
        const matchesSearch = searchTerm === '' || 
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.authors.some(author => author.name.toLowerCase().includes(searchTerm.toLowerCase()));

        // Filter by category
        const matchesCategory = selectedCategory === '' || 
          book.categories.some(category => category.id === selectedCategory);

        return matchesSearch && matchesCategory && book.available > 0;
      })
      .sort((a: Book, b: Book) => a.title.localeCompare(b.title));
  };

  // Get all unique categories from books
  const getCategories = () => {
    if (!data || !data.books) return [];

    const categories = new Set<string>();
    const categoryMap = new Map<string, string>();

    data.books.forEach((book: Book) => {
      book.categories.forEach(category => {
        categories.add(category.id);
        categoryMap.set(category.id, category.name);
      });
    });

    return Array.from(categories).map(id => ({
      id,
      name: categoryMap.get(id) || ''
    })).sort((a, b) => a.name.localeCompare(b.name));
  };

  if (loading) return <div className="p-4 text-center">Loading books...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading books: {error.message}</div>;

  const filteredBooks = getFilteredBooks();
  const categories = getCategories();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Library Books</h1>
      
      {/* Search and filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by title or author..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="md:w-64">
          <select
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Books grid */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No books found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book: Book) => (
            <div key={book.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Book cover image */}
              <div className="h-48 overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {book.coverImage ? (
                  <img 
                    src={book.coverImage} 
                    alt={book.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 dark:text-gray-500 text-center p-4">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    No cover image
                  </div>
                )}
              </div>
              
              {/* Book details */}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 line-clamp-2">{book.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {book.authors.map(author => author.name).join(', ')}
                </p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {book.categories.map(category => (
                    <span 
                      key={category.id}
                      className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1 line-clamp-2">
                  {book.description || 'No description available.'}
                </p>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  <span className="font-medium">Available:</span> {book.available} of {book.quantity}
                </div>
                <div className="flex space-x-2 mt-auto">
                  <button
                    onClick={() => handleBookSelect(book, 'BORROW')}
                    disabled={book.available <= 0}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Borrow
                  </button>
                  <button
                    onClick={() => handleBookSelect(book, 'READ')}
                    disabled={book.available <= 0}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Read
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Borrow/Read Modal */}
      {selectedBook && (
        <Modal
          isOpen={showModal}
          title={selectedBook?.title || ''}
          onCancel={() => setShowModal(false)}
          size="lg"
          type="form"
          confirmText={borrowType === 'READ' ? "Read Now" : "Borrow"}
          onConfirm={handleSubmit}
        >
          <div className="flex flex-col md:flex-row md:space-x-6">
            {/* Book cover image */}
            <div className="flex-shrink-0 mx-auto sm:mx-0 mb-4 md:mb-0">
              <img
                src={selectedBook?.coverImage || '/default-book-cover.jpg'}
                alt={`Cover of ${selectedBook?.title}`}
                className="rounded-lg object-cover shadow-md"
                style={{ maxWidth: "160px" }}
              />
            </div>
            
            {/* Book information */}
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 break-words">
                {selectedBook?.title}
              </h3>
              
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                <p><span className="font-medium">Author(s):</span> {selectedBook?.authors?.map(a => a.name).join(', ')}</p>
                <p><span className="font-medium">ISBN:</span> {selectedBook?.isbn}</p>
                <p><span className="font-medium">Categories:</span> {selectedBook?.categories?.map(c => c.name).join(', ')}</p>
                {selectedBook?.available !== undefined && (
                  <p>
                    <span className="font-medium">Available:</span> {selectedBook?.available}
                    {selectedBook.available === 0 && 
                      <span className="text-red-500 ml-2">(Currently unavailable)</span>
                    }
                  </p>
                )}
              </div>
              
              {/* Notes field */}
              <div className="mb-4">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (optional):
                </label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Add any notes about this borrow request..."
                />
              </div>
              
              {/* Due date selection for physical borrows */}
              {borrowType === 'BORROW' && (
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Return by:
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    value={selectedDueDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      setSelectedDueDate(selectedDate);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    min={getMinDate()}
                    max={getMaxDate()}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Books can be borrowed for up to 2 weeks. Please return by the selected date.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserBookView;