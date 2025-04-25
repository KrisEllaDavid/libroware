import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { GET_BOOKS, GET_AUTHORS, GET_CATEGORIES } from '../../graphql/queries';
import { CREATE_BOOK, UPDATE_BOOK, DELETE_BOOK } from '../../graphql/mutations';
import Modal from '../Modal';
import FloatingInput from '../FloatingInput';
import FloatingDropdown from '../FloatingDropdown';
import DeleteConfirmation from '../DeleteConfirmation';
import FileUpload from '../common/FileUpload';
import { useToast } from '../../context/ToastContext';

interface Author {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface Book {
  id: string;
  title: string;
  isbn: string;
  description: string | null;
  publishedAt: string;
  coverImage: string | null;
  pageCount: number;
  quantity: number;
  available: number;
  authors: Author[];
  categories: Category[];
}

interface BookFormData {
  title: string;
  isbn: string;
  description: string;
  publishedAt: string;
  coverImage: string;
  pageCount: number;
  quantity: number;
  authorIds: string[];
  categoryIds: string[];
}

interface BookManagementProps {
  onAuthorCreate?: () => void;
  onCategoryCreate?: () => void;
}

const initialFormData: BookFormData = {
  title: '',
  isbn: '',
  description: '',
  publishedAt: new Date().getFullYear().toString(), // Just the year
  coverImage: '',
  pageCount: 0,
  quantity: 1,
  authorIds: [],
  categoryIds: [],
};

const BookManagement: React.FC<BookManagementProps> = ({ 
  onAuthorCreate,
  onCategoryCreate 
}) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [formData, setFormData] = useState<BookFormData>(initialFormData);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [showNewAuthorModal, setShowNewAuthorModal] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);

  // GraphQL queries
  const { loading, error: queryError, data, refetch } = useQuery(GET_BOOKS, {
    variables: { skip: 0, take: 50, searchTitle: searchTerm || undefined },
  });

  const { data: authorsData } = useQuery(GET_AUTHORS, {
    variables: { skip: 0, take: 100 },
  });

  const { data: categoriesData } = useQuery(GET_CATEGORIES, {
    variables: { skip: 0, take: 100 },
  });

  // GraphQL mutations
  const [createBook, { loading: createLoading }] = useMutation(CREATE_BOOK, {
    onCompleted: () => {
      resetForm();
      setIsFormModalOpen(false);
      refetch();
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  const [updateBook, { loading: updateLoading }] = useMutation(UPDATE_BOOK, {
    onCompleted: () => {
      resetForm();
      setIsFormModalOpen(false);
      refetch();
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  const [deleteBook, { loading: deleteLoading }] = useMutation(DELETE_BOOK, {
    onCompleted: () => {
      refetch();
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  // Update state when data changes
  useEffect(() => {
    if (data && data.books) {
      setBooks(data.books);
    }
  }, [data]);

  useEffect(() => {
    if (authorsData && authorsData.authors) {
      setAuthors(authorsData.authors);
    }
  }, [authorsData]);

  useEffect(() => {
    if (categoriesData && categoriesData.categories) {
      setCategories(categoriesData.categories);
    }
  }, [categoriesData]);

  // Form handling
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'number') {
      setFormData({ ...formData, [name]: parseInt(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = e.target;
    const selectedValues: string[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    
    setFormData({ ...formData, [name]: selectedValues });
  };

  const handleSubmit = () => {
    setError(null);

    // Create a copy of the form data
    const input = { ...formData };
    
    // Ensure publishedAt is formatted correctly as a date string for the API
    try {
      // Try to parse the year as a number first
      const year = parseInt(input.publishedAt, 10);
      
      // Check if it's a valid year (4 digits, not too far in the past or future)
      if (!isNaN(year) && year >= 1000 && year <= 9999) {
        // Format as ISO date string with January 1st of that year
        input.publishedAt = `${year}-01-01`;
      } else {
        setError("Please enter a valid 4-digit year for publication date");
        return;
      }
    } catch (err) {
      setError("Invalid publication year format");
      return;
    }
    
    if (isEditing && selectedBookId) {
      updateBook({ variables: { id: selectedBookId, input: input } });
    } else {
      createBook({ variables: { input: input } });
    }
  };

  const handleEdit = (book: Book) => {
    setIsEditing(true);
    setSelectedBookId(book.id);
    
    // Extract year from publishedAt string (in case it's a full date)
    let publishedYear = book.publishedAt;
    try {
      const date = new Date(book.publishedAt);
      if (!isNaN(date.getTime())) {
        publishedYear = date.getFullYear().toString();
      }
    } catch (e) {
      // If parsing fails, keep the original value
    }
    
    setFormData({
      title: book.title,
      isbn: book.isbn,
      description: book.description || '',
      publishedAt: publishedYear,
      coverImage: book.coverImage || '',
      pageCount: book.pageCount,
      quantity: book.quantity,
      authorIds: book.authors.map(author => author.id),
      categoryIds: book.categories.map(category => category.id),
    });
    
    setIsFormModalOpen(true);
  };

  const handleCreate = () => {
    setIsEditing(false);
    setSelectedBookId(null);
    setFormData(initialFormData);
    setIsFormModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setBookToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (bookToDelete) {
      deleteBook({ variables: { id: bookToDelete } });
      setIsDeleteModalOpen(false);
      setBookToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setBookToDelete(null);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedBookId(null);
    setIsEditing(false);
    setError(null);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleShowAuthorCreate = () => {
    if (onAuthorCreate) {
      setIsFormModalOpen(false);
      onAuthorCreate();
    }
  };

  const handleShowCategoryCreate = () => {
    if (onCategoryCreate) {
      setIsFormModalOpen(false);
      onCategoryCreate();
    }
  };

  // Add a handler for when book cover is uploaded successfully
  const handleCoverImageUpdate = (url: string) => {
    setFormData(prev => ({
      ...prev,
      coverImage: url
    }));
  };

  if (queryError) return <p>Error loading books: {queryError.message}</p>;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow dark:bg-gray-800 dark:border dark:border-gray-700 sm:rounded-md transition-colors">
        <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6 flex flex-col sm:flex-row justify-between sm:items-center space-y-4 sm:space-y-0">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white transition-colors">
            Books
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search books..."
                className="input w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 w-full sm:w-auto justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
              </svg>
              Add Book
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">ISBN</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Authors</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Categories</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Quantity</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Available</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent align-[-0.125em]" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading books...</p>
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center p-8">
                      <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                        {searchTerm ? `No books match "${searchTerm}"` : "No books found. Click \"Add Book\" to create one."}
                      </p>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{book.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                        ISBN: {book.isbn}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 md:hidden">
                        Authors: {book.authors.map(a => a.name).join(', ')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 md:hidden">
                        Categories: {book.categories.map(c => c.name).join(', ')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                        {book.quantity} copies, {book.available} available
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">{book.isbn}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">{book.authors.map(a => a.name).join(', ')}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">{book.categories.map(c => c.name).join(', ')}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">{book.quantity}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">{book.available}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(book)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          aria-label={`Edit ${book.title}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(book.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
                          aria-label={`Delete ${book.title}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Book Modal */}
      <Modal
        isOpen={isFormModalOpen}
        title={isEditing ? "Edit Book" : "Add New Book"}
        onCancel={() => {
          setIsFormModalOpen(false);
          resetForm();
        }}
        onConfirm={handleSubmit}
        confirmText={createLoading || updateLoading ? "Saving..." : "Save"}
        cancelText="Cancel"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingInput
              id="title"
              name="title"
              label="Title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
            <FloatingInput
              id="isbn"
              name="isbn"
              label="ISBN"
              value={formData.isbn}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <FloatingInput
            id="description"
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleInputChange}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingInput
              id="publishedAt"
              name="publishedAt"
              label="Publication Year"
              type="number"
              value={formData.publishedAt}
              onChange={handleInputChange}
            />
            <FloatingInput
              id="pageCount"
              name="pageCount"
              label="Page Count"
              type="number"
              value={formData.pageCount.toString()}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingInput
              id="quantity"
              name="quantity"
              label="Quantity"
              type="number"
              value={formData.quantity.toString()}
              onChange={handleInputChange}
              required
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cover Image
              </label>
              {isEditing ? (
                <FileUpload
                  entityId={selectedBookId || ''}
                  uploadType="BOOK_COVER"
                  currentImageUrl={formData.coverImage}
                  onUploadSuccess={handleCoverImageUpdate}
                  onUploadError={(error) => setError(error)}
                  buttonLabel="Upload Cover Image"
                />
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  You can upload a cover image after creating the book.
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Authors
            </label>
            <div className="flex items-center space-x-2">
              <select
                name="authorIds"
                multiple
                value={formData.authorIds}
                onChange={handleMultiSelectChange}
                className="input h-auto min-h-[80px] w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              >
                {authors.map((author) => (
                  <option key={author.id} value={author.id} className="py-1 px-2 dark:text-gray-100">
                    {author.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleShowAuthorCreate}
                className="btn btn-secondary h-10 px-3 py-2 flex-shrink-0 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                title="Add New Author"
              >
                <span className="sr-only">Add New Author</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Hold Ctrl or Cmd to select multiple authors
            </p>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Categories
            </label>
            <div className="flex items-center space-x-2">
              <select
                name="categoryIds"
                multiple
                value={formData.categoryIds}
                onChange={handleMultiSelectChange}
                className="input h-auto min-h-[80px] w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id} className="py-1 px-2 dark:text-gray-100">
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleShowCategoryCreate}
                className="btn btn-secondary h-10 px-3 py-2 flex-shrink-0 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                title="Add New Category"
              >
                <span className="sr-only">Add New Category</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Hold Ctrl or Cmd to select multiple categories
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        title="Delete Book"
        message="Are you sure you want to delete this book? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default BookManagement; 