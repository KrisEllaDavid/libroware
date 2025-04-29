import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { GET_CATEGORIES } from '../../graphql/queries';
import { CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY } from '../../graphql/mutations';
import Modal from '../Modal';
import FloatingInput from '../FloatingInput';
import DeleteConfirmation from '../DeleteConfirmation';
import { Category } from '../../types';

interface CategoryFormData {
  name: string;
  description: string;
}

const initialFormData: CategoryFormData = {
  name: '',
  description: '',
};

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // GraphQL queries and mutations
  const { loading, error: queryError, data, refetch } = useQuery(GET_CATEGORIES, {
    variables: { skip: 0, take: 50 },
    onCompleted: (data: { categories: Category[] }) => {
      console.log("Categories data received:", data);
    },
    onError: (error: Error) => {
      console.error("GraphQL query error:", error);
    }
  });

  const [createCategory, { loading: createLoading }] = useMutation(CREATE_CATEGORY, {
    onCompleted: () => {
      resetForm();
      setIsFormModalOpen(false);
      refetch();
    },
    onError: (error: any) => {
      console.error("Create category error:", error);
      setError(error.message);
    },
  });

  const [updateCategory, { loading: updateLoading }] = useMutation(UPDATE_CATEGORY, {
    onCompleted: () => {
      resetForm();
      setIsFormModalOpen(false);
      refetch();
    },
    onError: (error: any) => {
      console.error("Update category error:", error);
      setError(error.message);
    },
  });

  const [deleteCategory, { loading: deleteLoading }] = useMutation(DELETE_CATEGORY, {
    onCompleted: () => {
      refetch();
    },
    onError: (error: any) => {
      console.error("Delete category error:", error);
      setError(error.message);
    },
  });

  // Update state when data changes
  useEffect(() => {
    console.log("Category data or loading changed:", { data, loading });
    
    try {
      if (data && data.categories) {
        console.log("Setting categories from data:", data.categories);
        setCategories(data.categories);
      } else if (!loading) {
        console.log("No categories data, setting empty array");
        setCategories([]);
      }
    } catch (error) {
      console.error("Error in useEffect:", error);
    }
  }, [data, loading]);

  // Form handling
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    setError(null);

    if (!formData.name.trim()) {
      setError("Category name is required");
      return;
    }
    
    const input = { ...formData };
    
    if (isEditing && selectedCategoryId) {
      updateCategory({ variables: { id: selectedCategoryId, data: input } });
    } else {
      createCategory({ variables: { input: input } });
    }
  };

  const handleEdit = (category: Category) => {
    setIsEditing(true);
    setSelectedCategoryId(category.id);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setIsFormModalOpen(true);
  };

  const handleCreate = () => {
    setIsEditing(false);
    setSelectedCategoryId(null);
    setFormData(initialFormData);
    setIsFormModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setCategoryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory({ variables: { id: categoryToDelete } });
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedCategoryId(null);
    setIsEditing(false);
    setError(null);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredCategories = categories.filter((category) => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderContent = () => {
    if (queryError) {
      return <p>Error loading categories: {queryError.message}</p>;
    }

    if (loading) {
      return (
        <div className="p-6 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent align-[-0.125em]" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 transition-colors">Loading categories...</p>
        </div>
      );
    }

    if (filteredCategories.length === 0) {
      return (
        <div className="p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
            {searchTerm ? "No categories match your search." : "No categories found. Click \"Add Category\" to create one."}
          </p>
        </div>
      );
    }

    return (
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredCategories.map((category) => (
          <li key={category.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white transition-colors">{category.name}</h4>
                {category.description && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 transition-colors">{category.description}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleEdit(category)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Edit Category"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(category.id)}
                  disabled={deleteLoading}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Delete Category"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
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
            Categories
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search categories..."
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
                <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              Add Category
            </button>
          </div>
        </div>
        
        {renderContent()}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        title={isEditing ? "Edit Category" : "Add New Category"}
        onConfirm={handleSubmit}
        onCancel={() => setIsFormModalOpen(false)}
        confirmText={createLoading || updateLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
        size="md"
      >
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
            <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
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
              label="Category Name"
            />
          </div>

          <div className="col-span-1">
            <FloatingInput
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              label="Description (optional)"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <DeleteConfirmation 
        isOpen={isDeleteModalOpen}
        itemType="category"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={deleteLoading}
        message="Are you sure you want to delete this category? This will remove the category from all associated books."
      />
    </div>
  );
};

export default CategoryManagement; 