import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { GET_CATEGORIES } from '../../graphql/queries';
import { CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY } from '../../graphql/mutations';
import Modal from '../Modal';
import FloatingInput from '../FloatingInput';
import DeleteConfirmation from '../DeleteConfirmation';
import {
  Alert,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  IconButton,
  PageHeader,
  SearchInput,
  Icon,
  Skeleton,
} from '../ui';
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
  const { t } = useTranslation();
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
      setError(t('categories.nameRequired'));
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
      return (
        <ErrorState
          message={queryError.message}
          onRetry={() => refetch()}
        />
      );
    }

    if (loading) {
      return (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex items-center gap-4 px-5 py-4 sm:px-6">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-16" />
            </li>
          ))}
        </ul>
      );
    }

    if (filteredCategories.length === 0) {
      return (
        <EmptyState
          icon="tag"
          title={searchTerm ? t('categories.noMatchTitle', 'No matching categories') : t('categories.noCategoriesTitle', 'No categories yet')}
          description={searchTerm ? t('categories.noMatchSearch') : t('categories.noCategoriesHint')}
          action={
            searchTerm ? (
              <Button variant="secondary" icon="close" onClick={() => setSearchTerm('')}>
                {t('common.clearSearch', 'Clear search')}
              </Button>
            ) : (
              <Button variant="primary" icon="plus" onClick={handleCreate}>
                {t('categories.addNew')}
              </Button>
            )
          }
        />
      );
    }

    return (
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {filteredCategories.map((category) => (
          <li
            key={category.id}
            className="flex items-start gap-4 px-5 py-4 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/50 sm:px-6"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-400"
            >
              <Icon name="tag" size={17} />
            </span>

            <div className="min-w-0 flex-1">
              <h4 className="break-words text-sm font-medium text-gray-900 dark:text-white">
                {category.name}
              </h4>
              {category.description && (
                <p className="mt-1 break-words text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {category.description}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <IconButton
                icon="edit"
                label={t('categories.editCategory')}
                onClick={() => handleEdit(category)}
              />
              <IconButton
                icon="trash"
                tone="danger"
                label={t('categories.deleteCategory')}
                disabled={deleteLoading}
                onClick={() => handleDelete(category.id)}
              />
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        icon="tag"
        eyebrow={t('admin.tabs.categories')}
        title={t('categories.title')}
        description={t(
          'categories.subtitle',
          'Shelf categories used to classify and browse the catalogue.'
        )}
        actions={
          <Button variant="primary" icon="plus" onClick={handleCreate}>
            {t('categories.addNew')}
          </Button>
        }
      />

      <Card>
        <CardHeader
          title={t('categories.title')}
          description={t('categories.count', {
            count: filteredCategories.length,
            defaultValue: `${filteredCategories.length.toLocaleString()} categories`,
          })}
          actions={
            <SearchInput
              value={searchTerm}
              onChange={handleSearch}
              onClear={() => setSearchTerm('')}
              placeholder={t('categories.searchPlaceholder')}
              wrapperClassName="sm:w-72"
            />
          }
        />

        {renderContent()}
      </Card>

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        title={isEditing ? t('categories.editCategory') : t('categories.addNewCategory')}
        onConfirm={handleSubmit}
        onCancel={() => setIsFormModalOpen(false)}
        confirmText={createLoading || updateLoading ? t('categories.saving') : isEditing ? t('categories.update') : t('categories.create')}
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
              label={t('categories.nameLabel')}
            />
          </div>

          <div className="col-span-1">
            <FloatingInput
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              label={t('categories.descriptionOptional')}
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
        message={t('categories.deleteWarning')}
      />
    </div>
  );
};

export default CategoryManagement; 