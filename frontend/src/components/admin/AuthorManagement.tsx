import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useTranslation } from "react-i18next";
import { GET_AUTHORS } from "../../graphql/queries";
import {
  CREATE_AUTHOR,
  UPDATE_AUTHOR,
  DELETE_AUTHOR,
} from "../../graphql/mutations";
import Modal from "../Modal";
import { fmtDate } from "../../utils/date";
import FloatingInput from "../FloatingInput";
import DeleteConfirmation from "../DeleteConfirmation";
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
  Skeleton,
} from "../ui";
import { Author } from "../../types";

interface AuthorFormData {
  name: string;
}

const initialFormData: AuthorFormData = {
  name: "",
};

import { fmtDate as formatDate } from "../../utils/date";

const AuthorManagement: React.FC = () => {
  const { t } = useTranslation();
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
      setError(t('authors.nameRequired'));
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
      return <ErrorState message={queryError.message} onRetry={() => refetch()} />;
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

    if (authors.length === 0) {
      return (
        <EmptyState
          icon="user"
          title={searchTerm ? t('authors.noMatchTitle', 'No matching authors') : t('authors.noAuthorsTitle', 'No authors yet')}
          description={searchTerm ? undefined : t('authors.noAuthorsHint')}
          action={
            searchTerm ? (
              <Button variant="secondary" icon="close" onClick={() => setSearchTerm('')}>
                {t('common.clearSearch', 'Clear search')}
              </Button>
            ) : (
              <Button variant="primary" icon="plus" onClick={handleCreate}>
                {t('authors.addNew')}
              </Button>
            )
          }
        />
      );
    }

    return (
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {authors.map((author) => (
          <li
            key={author.id}
            className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/50 sm:px-6"
          >
            {/* Initial disc: gives an otherwise text-only list a left edge to
                scan down, and makes alphabetical order legible at a glance. */}
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 font-display text-sm font-semibold uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            >
              {author.name.trim().charAt(0) || '?'}
            </span>

            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {author.name}
              </h4>
              {author.createdAt && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {t('authors.added', { date: formatDate(author.createdAt) })}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <IconButton
                icon="edit"
                label={t('authors.editAuthor')}
                onClick={() => handleEdit(author)}
              />
              <IconButton
                icon="trash"
                tone="danger"
                label={t('authors.deleteAuthor')}
                disabled={deleteLoading}
                onClick={() => handleDelete(author.id)}
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
        icon="user"
        eyebrow={t('admin.tabs.authors')}
        title={t('authors.title')}
        description={t(
          'authors.subtitle',
          'The people credited on the titles in the catalogue.'
        )}
        actions={
          <Button variant="primary" icon="plus" onClick={handleCreate}>
            {t('authors.addNew')}
          </Button>
        }
      />

      <Card>
        <CardHeader
          title={t('authors.title')}
          description={t('authors.count', {
            count: authors.length,
            defaultValue: `${authors.length.toLocaleString()} authors`,
          })}
          actions={
            <SearchInput
              value={searchTerm}
              onChange={handleSearch}
              onClear={() => setSearchTerm('')}
              placeholder={t('authors.searchPlaceholder')}
              wrapperClassName="sm:w-72"
            />
          }
        />

        {renderContent()}
      </Card>

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        title={isEditing ? t('authors.editAuthor') : t('authors.addNewAuthor')}
        onConfirm={handleSubmit}
        onCancel={() => setIsFormModalOpen(false)}
        confirmText={
          createLoading || updateLoading
            ? t('authors.saving')
            : isEditing
            ? t('authors.update')
            : t('authors.create')
        }
        size="md"
      >
        <div className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}

          <FloatingInput
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            label={t('authors.nameLabel')}
          />
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
