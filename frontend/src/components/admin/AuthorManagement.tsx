import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { GET_AUTHORS } from "../../graphql/queries";
import {
  CREATE_AUTHOR,
  UPDATE_AUTHOR,
  DELETE_AUTHOR,
} from "../../graphql/mutations";
import Modal from "../Modal";
import FloatingInput from "../FloatingInput";
import DeleteConfirmation from "../DeleteConfirmation";
import { Author } from "../../types";

interface AuthorFormData {
  name: string;
}

const initialFormData: AuthorFormData = {
  name: "",
};

// Helper function to format dates
const formatDate = (dateString?: string | null) => {
  try {
    if (!dateString) {
      return "N/A";
    }

    // Parse the date string
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

const AuthorManagement: React.FC = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [formData, setFormData] = useState<AuthorFormData>(initialFormData);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [authorToDelete, setAuthorToDelete] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // GraphQL queries and mutations
  const {
    loading,
    error: queryError,
    data,
    refetch,
  } = useQuery(GET_AUTHORS, {
    variables: { skip: 0, take: 50, searchName: searchTerm || undefined },
    onCompleted: (data: { authors: Author[] }) => {
      console.log("Authors data received:", data);
    },
    onError: (error: Error) => {
      console.error("GraphQL query error:", error);
    },
  });

  const [createAuthor, { loading: createLoading }] = useMutation(
    CREATE_AUTHOR,
    {
      onCompleted: () => {
        resetForm();
        setIsFormModalOpen(false);
        refetch();
      },
      onError: (error: any) => {
        console.error("Create author error:", error);
        setError(error.message);
      },
    }
  );

  const [updateAuthor, { loading: updateLoading }] = useMutation(
    UPDATE_AUTHOR,
    {
      onCompleted: () => {
        resetForm();
        setIsFormModalOpen(false);
        refetch();
      },
      onError: (error: any) => {
        console.error("Update author error:", error);
        setError(error.message);
      },
    }
  );

  const [deleteAuthor, { loading: deleteLoading }] = useMutation(
    DELETE_AUTHOR,
    {
      onCompleted: () => {
        refetch();
      },
      onError: (error: any) => {
        console.error("Delete author error:", error);
        setError(error.message);
      },
    }
  );

  // Update authors state when data changes
  useEffect(() => {
    console.log("Data or loading changed:", { data, loading });

    try {
      if (data && data.authors) {
        console.log("Setting authors from data:", data.authors);
        setAuthors(data.authors);
      } else if (!loading) {
        console.log("No authors data, setting empty array");
        setAuthors([]);
      }
    } catch (error) {
      console.error("Error in useEffect:", error);
    }
  }, [data, loading]);

  // Form handling
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    setError(null);

    if (!formData.name.trim()) {
      setError("Author name is required");
      return;
    }

    const input = { ...formData };

    if (isEditing && selectedAuthorId) {
      updateAuthor({ variables: { id: selectedAuthorId, data: input } });
    } else {
      createAuthor({ variables: { input: input } });
    }
  };

  const handleEdit = (author: Author) => {
    setIsEditing(true);
    setSelectedAuthorId(author.id);
    setFormData({
      name: author.name,
    });
    setIsFormModalOpen(true);
  };

  const handleCreate = () => {
    setIsEditing(false);
    setSelectedAuthorId(null);
    setFormData(initialFormData);
    setIsFormModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setAuthorToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (authorToDelete) {
      deleteAuthor({ variables: { id: authorToDelete } });
      setIsDeleteModalOpen(false);
      setAuthorToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setAuthorToDelete(null);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedAuthorId(null);
    setIsEditing(false);
    setError(null);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const renderContent = () => {
    if (queryError) {
      return <p>Error loading authors: {queryError.message}</p>;
    }

    if (loading) {
      return (
        <div className="p-6 text-center">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent align-[-0.125em]"
            role="status"
          >
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 transition-colors">
            Loading authors...
          </p>
        </div>
      );
    }

    if (authors.length === 0) {
      return (
        <div className="p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
            No authors found. Click "Add Author" to create one.
          </p>
        </div>
      );
    }

    return (
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {authors.map((author) => (
          <li
            key={author.id}
            className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 sm:px-6 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
                  {author.name}
                </h4>
                {author.createdAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                    Added: {formatDate(author.createdAt)}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleEdit(author)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Edit Author"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                    <path
                      fillRule="evenodd"
                      d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(author.id)}
                  disabled={deleteLoading}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Delete Author"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow dark:bg-gray-800 dark:border dark:border-gray-700 sm:rounded-md transition-colors">
        <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6 flex flex-col sm:flex-row justify-between sm:items-center space-y-4 sm:space-y-0">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white transition-colors">
            Authors
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search authors..."
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              Add Author
            </button>
          </div>
        </div>

        {renderContent()}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        title={isEditing ? "Edit Author" : "Add New Author"}
        onConfirm={handleSubmit}
        onCancel={() => setIsFormModalOpen(false)}
        confirmText={
          createLoading || updateLoading
            ? "Saving..."
            : isEditing
            ? "Update"
            : "Create"
        }
        size="md"
      >
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
            <div className="text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-y-4">
          <div className="col-span-1">
            <FloatingInput
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              label="Author Name"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        itemType="author"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default AuthorManagement;
