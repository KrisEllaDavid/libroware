import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_BOOKS } from "../graphql/queries";

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
  authors: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

const Books: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [books, setBooks] = useState<Book[]>([]);

  const { loading, error, data } = useQuery(GET_BOOKS, {
    variables: {
      skip: 0,
      take: 50,
      searchTitle: searchTerm || undefined,
    },
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (data && data.books) {
      setBooks(data.books);
    }
  }, [data]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (loading && !books.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-10">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent align-[-0.125em]"
            role="status"
          >
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Loading books...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <p className="text-red-700 dark:text-red-300">
            Error loading books: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
          Library Catalog
        </h1>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search books..."
            className="pl-8 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 w-full"
            value={searchTerm}
            onChange={handleSearch}
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
      </div>

      {books.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm
              ? "No books match your search."
              : "No books in the library catalog."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col"
            >
              <div className="h-60 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 dark:text-gray-500">
                    No cover available
                  </div>
                )}
              </div>

              <div className="p-4 flex-grow">
                <h2 className="font-bold text-gray-800 dark:text-white text-lg mb-1 line-clamp-2">
                  {book.title}
                </h2>

                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  {book.authors.map((a) => a.name).join(", ")}
                </p>

                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Published
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {new Date(book.publishedAt).getFullYear()}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Pages
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {book.pageCount}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Availability
                    </span>
                    <span
                      className={`font-medium ${
                        book.available > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {book.available > 0
                        ? `${book.available} available`
                        : "Not available"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4">
                <button
                  disabled={book.available <= 0}
                  className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    book.available > 0
                      ? "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {book.available > 0 ? "Borrow" : "Unavailable"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Books;
