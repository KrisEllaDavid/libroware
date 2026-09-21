import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { useMutation, useLazyQuery } from "@apollo/client/react";
import { GET_BOOKS, GET_AUTHORS, GET_CATEGORIES, GET_BOOK_BY_ISBN } from "../../graphql/queries";
import {
  CREATE_BOOK,
  UPDATE_BOOK,
  DELETE_BOOK,
  CREATE_AUTHOR,
  CREATE_CATEGORY,
} from "../../graphql/mutations";
import Modal from "../Modal";
import FloatingInput from "../FloatingInput";
import FloatingDropdown from "../FloatingDropdown";
import DeleteConfirmation from "../DeleteConfirmation";
import FileUpload from "../common/FileUpload";
import { useToast } from "../../context/ToastContext";
import BookQRModal from "./BookQRModal";
import QRLabelSheet from "./QRLabelSheet";
import ISBNLookup from "./ISBNLookup";
import Pagination from "../common/Pagination";
import {
  Alert,
  BookCover,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  IconButton,
  PageHeader,
  RowActions,
  SearchInput,
  StackedMeta,
  Table,
  TableMessage,
  TableSkeleton,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  Tag,
  TR,
} from "../ui";

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

const ISBN_REGEX = /^(?:\d{9}[\dXx]|\d{13})$/;

const initialFormData: BookFormData = {
  title: "",
  isbn: "",
  description: "",
  publishedAt: new Date().getFullYear().toString(), // Just the year
  coverImage: "",
  pageCount: 0,
  quantity: 1,
  authorIds: [],
  categoryIds: [],
};

const BookManagement: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [formData, setFormData] = useState<BookFormData>(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof BookFormData, string>>>({});
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [showNewAuthorModal, setShowNewAuthorModal] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);
  // Author/category names picked up from the ISBN lookup. Resolved into real
  // records (creating any that don't exist yet) only at submit time, so
  // nothing is created if the user cancels the book form first.
  const [pendingAuthorNames, setPendingAuthorNames] = useState<string[]>([]);
  const [pendingCategoryNames, setPendingCategoryNames] = useState<string[]>([]);
  const [qrBook, setQrBook] = useState<Book | null>(null);
  const [showLabelSheet, setShowLabelSheet] = useState(false);

  // GraphQL queries
  const {
    loading,
    error: queryError,
    data,
    refetch,
  } = useQuery(GET_BOOKS, {
    variables: { skip: page * 25, take: 25, searchTitle: searchTerm || undefined },
  });

  const { data: authorsData } = useQuery(GET_AUTHORS, {
    variables: { skip: 0, take: 100 },
  });

  const { data: categoriesData } = useQuery(GET_CATEGORIES, {
    variables: { skip: 0, take: 100 },
  });

  // GraphQL mutations
  const { addToast } = useToast();

  // Success/failure for create & update is handled inline in handleSubmit
  // (awaited from the Modal's onConfirm) so the modal only closes, and only
  // shows a success toast, once the mutation has actually settled.
  const [createBook, { loading: createLoading }] = useMutation(CREATE_BOOK);
  const [updateBook, { loading: updateLoading }] = useMutation(UPDATE_BOOK);

  const [deleteBook, { loading: deleteLoading }] = useMutation(DELETE_BOOK, {
    onCompleted: () => {
      refetch();
    },
    onError: (error: any) => {
      setError(error.message);
      addToast(`Failed to delete book: ${error.message}`, 'error');
    },
  });

  const [createAuthorInline, { loading: creatingAuthor }] = useMutation(CREATE_AUTHOR);
  const [createCategoryInline, { loading: creatingCategory }] = useMutation(CREATE_CATEGORY);

  const [checkIsbn] = useLazyQuery(GET_BOOK_BY_ISBN, {
    fetchPolicy: "network-only",
    onCompleted: (data: any) => {
      if (data?.bookByIsbn) {
        setFieldErrors((prev) => ({
          ...prev,
          isbn: `A book with this ISBN already exists: "${data.bookByIsbn.title}"`,
        }));
      }
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "number") {
      setFormData({ ...formData, [name]: parseInt(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (fieldErrors[name as keyof BookFormData]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof BookFormData];
        return next;
      });
    }
  };

  const handleIsbnBlur = () => {
    const isbn = formData.isbn.replace(/[-\s]/g, "");
    // Only worth checking against the database once the ISBN looks
    // plausible — avoids firing a query on every partial keystroke.
    if (isEditing || !ISBN_REGEX.test(isbn)) return;
    checkIsbn({ variables: { isbn } });
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

  const validate = (data: BookFormData): Partial<Record<keyof BookFormData, string>> => {
    const errors: Partial<Record<keyof BookFormData, string>> = {};

    if (!data.title.trim()) {
      errors.title = "Title is required";
    }

    const isbnDigits = data.isbn.replace(/[-\s]/g, "");
    if (!isbnDigits) {
      errors.isbn = "ISBN is required";
    } else if (!ISBN_REGEX.test(isbnDigits)) {
      errors.isbn = "Enter a valid 10 or 13-character ISBN";
    }

    if (!data.pageCount || data.pageCount < 1) {
      errors.pageCount = "Page count must be at least 1";
    }

    if (!data.quantity || data.quantity < 1) {
      errors.quantity = "Quantity must be at least 1";
    }

    const year = parseInt(data.publishedAt, 10);
    if (isNaN(year) || year < 1000 || year > new Date().getFullYear()) {
      errors.publishedAt = `Enter a valid year between 1000 and ${new Date().getFullYear()}`;
    }

    return errors;
  };

  // Resolves author/category names (e.g. from the ISBN lookup) to IDs,
  // matching against existing records by name (case-insensitive) and
  // creating any that don't exist yet.
  const resolveAuthorIds = async (names: string[]): Promise<string[]> => {
    const ids: string[] = [];
    let list = authors;
    for (const raw of names) {
      const name = raw.trim();
      if (!name) continue;
      const existing = list.find((a) => a.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        ids.push(existing.id);
        continue;
      }
      const result: any = await createAuthorInline({ variables: { input: { name } } });
      const created = result?.data?.createAuthor;
      if (created) {
        list = [...list, created];
        setAuthors(list);
        ids.push(created.id);
      }
    }
    return ids;
  };

  const resolveCategoryIds = async (names: string[]): Promise<string[]> => {
    const ids: string[] = [];
    let list = categories;
    for (const raw of names) {
      const name = raw.trim();
      if (!name) continue;
      const existing = list.find((c) => c.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        ids.push(existing.id);
        continue;
      }
      const result: any = await createCategoryInline({ variables: { input: { name } } });
      const created = result?.data?.createCategory;
      if (created) {
        list = [...list, created];
        setCategories(list);
        ids.push(created.id);
      }
    }
    return ids;
  };

  // Thrown errors are caught by Modal's onConfirm handler, which then keeps
  // the modal open instead of closing it with a false "success" toast.
  const handleSubmit = async () => {
    setError(null);

    const errors = validate(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      throw new Error("Please fix the highlighted fields");
    }
    setFieldErrors({});

    const year = parseInt(formData.publishedAt, 10);
    let input = { ...formData, isbn: formData.isbn.replace(/[-\s]/g, ""), publishedAt: `${year}-01-01` };

    try {
      if (isEditing && selectedBookId) {
        await updateBook({ variables: { id: selectedBookId, input } });
        refetch();
      } else {
        // Resolve any author/category names picked up from the ISBN lookup —
        // creating ones that don't exist yet — only now, at submit time, so
        // nothing gets created in the database if the user cancels first.
        if (pendingAuthorNames.length > 0 || pendingCategoryNames.length > 0) {
          const [resolvedAuthorIds, resolvedCategoryIds] = await Promise.all([
            resolveAuthorIds(pendingAuthorNames),
            resolveCategoryIds(pendingCategoryNames),
          ]);
          input = {
            ...input,
            authorIds: Array.from(new Set([...input.authorIds, ...resolvedAuthorIds])),
            categoryIds: Array.from(new Set([...input.categoryIds, ...resolvedCategoryIds])),
          };
          setPendingAuthorNames([]);
          setPendingCategoryNames([]);
        }

        const result: any = await createBook({ variables: { input } });
        refetch();
        const newId = result?.data?.createBook?.id;
        if (newId) {
          // Stay open and switch into edit mode so a cover image can be
          // uploaded right away, instead of forcing a second "edit" trip.
          setIsEditing(true);
          setSelectedBookId(newId);
          setJustCreated(true);
          // Reflect what was actually resolved/saved in the multi-selects.
          setFormData((prev) => ({ ...prev, authorIds: input.authorIds, categoryIds: input.categoryIds }));
        }
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleEdit = (book: Book) => {
    setIsEditing(true);
    setJustCreated(false);
    setFieldErrors({});
    setPendingAuthorNames([]);
    setPendingCategoryNames([]);
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
      description: book.description || "",
      publishedAt: publishedYear,
      coverImage: book.coverImage || "",
      pageCount: book.pageCount,
      quantity: book.quantity,
      authorIds: book.authors.map((author) => author.id),
      categoryIds: book.categories.map((category) => category.id),
    });

    setIsFormModalOpen(true);
  };

  const handleCreate = () => {
    setIsEditing(false);
    setJustCreated(false);
    setFieldErrors({});
    setPendingAuthorNames([]);
    setPendingCategoryNames([]);
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
    setJustCreated(false);
    setFieldErrors({});
    setPendingAuthorNames([]);
    setPendingCategoryNames([]);
    setError(null);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  // Opens a small inline modal on top of the book form so an author/category
  // can be created without losing the in-progress book draft.
  const handleShowAuthorCreate = () => {
    setNewAuthorName("");
    setInlineError(null);
    setShowNewAuthorModal(true);
  };

  const handleCreateAuthorInline = async () => {
    const name = newAuthorName.trim();
    if (!name) {
      setInlineError("Author name is required");
      throw new Error("Author name is required");
    }

    try {
      const result: any = await createAuthorInline({ variables: { input: { name } } });
      const created = result?.data?.createAuthor;
      if (created) {
        setAuthors((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setFormData((prev) => ({ ...prev, authorIds: [...prev.authorIds, created.id] }));
      }
    } catch (err: any) {
      setInlineError(err.message);
      throw err;
    }
  };

  const handleShowCategoryCreate = () => {
    setNewCategoryName("");
    setNewCategoryDescription("");
    setInlineError(null);
    setShowNewCategoryModal(true);
  };

  const handleCreateCategoryInline = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      setInlineError("Category name is required");
      throw new Error("Category name is required");
    }

    try {
      const result: any = await createCategoryInline({
        variables: { input: { name, description: newCategoryDescription.trim() || undefined } },
      });
      const created = result?.data?.createCategory;
      if (created) {
        setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setFormData((prev) => ({ ...prev, categoryIds: [...prev.categoryIds, created.id] }));
      }
    } catch (err: any) {
      setInlineError(err.message);
      throw err;
    }
  };

  // Add a handler for when book cover is uploaded successfully
  const handleCoverImageUpdate = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      coverImage: url,
    }));
  };

  if (queryError) {
    return (
      <ErrorState
        title="Could not load the catalogue"
        message={queryError.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        icon="books"
        eyebrow="Catalogue"
        title="Books"
        description="Every title the library holds, with its copies, authors and shelf categories."
        actions={
          <>
            <Button
              icon="print"
              onClick={() => setShowLabelSheet(true)}
              disabled={books.length === 0}
              title="Print QR labels for all books"
            >
              Print QR labels
            </Button>
            <Button variant="primary" icon="plus" onClick={handleCreate}>
              Add book
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader
          title="Catalogue"
          description={`${(data?.booksCount ?? books.length).toLocaleString()} titles`}
          actions={
            <SearchInput
              value={searchTerm}
              onChange={handleSearch}
              onClear={() => setSearchTerm("")}
              placeholder="Search by title, author or ISBN"
              wrapperClassName="sm:w-80"
            />
          }
        />

        {/*
          Columns drop from the right as the viewport narrows: categories and
          authors go first, then ISBN and the copy counts. Everything dropped
          reappears as a secondary line under the title, so a phone still shows
          the whole record -- stacked instead of ruled.
        */}
        <TableWrap>
          <Table>
            <THead>
              <TR className="hover:bg-transparent dark:hover:bg-transparent">
                <TH>Title</TH>
                <TH hideBelow="sm">ISBN</TH>
                <TH hideBelow="md">Authors</TH>
                <TH hideBelow="lg">Categories</TH>
                <TH hideBelow="sm" align="right">Copies</TH>
                <TH align="right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TableMessage colSpan={6}>
                  <TableSkeleton rows={8} cols={4} />
                </TableMessage>
              ) : books.length === 0 ? (
                <TableMessage colSpan={6}>
                  <EmptyState
                    icon="books"
                    title={searchTerm ? "No matching books" : "The catalogue is empty"}
                    description={
                      searchTerm
                        ? `Nothing matches "${searchTerm}". Try an author name or an ISBN.`
                        : "Add the library's first title to get started."
                    }
                    action={
                      searchTerm ? (
                        <Button variant="secondary" icon="close" onClick={() => setSearchTerm("")}>
                          Clear search
                        </Button>
                      ) : (
                        <Button variant="primary" icon="plus" onClick={handleCreate}>
                          Add book
                        </Button>
                      )
                    }
                  />
                </TableMessage>
              ) : (
                books.map((book) => {
                  const authorNames = book.authors.map((a) => a.name).join(", ");
                  const out = book.quantity - book.available;
                  return (
                    <TR key={book.id}>
                      <TD className="max-w-[22rem]">
                        <div className="flex items-start gap-3">
                          {/* A thumbnail turns a wall of text into a shelf you
                              can scan. Titles with no cover art get a drawn one
                              rather than a grey box. */}
                          <div className="hidden h-14 w-10 shrink-0 overflow-hidden rounded-md shadow-xs xs:block">
                            <BookCover
                              title={book.title}
                              src={book.coverImage}
                              size="sm"
                              rounded="rounded-md"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="break-words font-medium text-gray-900 dark:text-white">
                              {book.title}
                            </p>
                            <StackedMeta showBelow="md">
                              {authorNames || "Unknown author"}
                            </StackedMeta>
                            <StackedMeta showBelow="sm" label="ISBN">
                              {book.isbn}
                            </StackedMeta>
                            <StackedMeta showBelow="sm">
                              {book.available} of {book.quantity} available
                            </StackedMeta>
                          </div>
                        </div>
                      </TD>

                      <TD hideBelow="sm" className="font-mono text-xs text-gray-500 dark:text-gray-400">
                        {book.isbn}
                      </TD>

                      <TD hideBelow="md" className="max-w-[14rem]">
                        <span className="line-clamp-2 break-words">{authorNames}</span>
                      </TD>

                      <TD hideBelow="lg" className="max-w-[14rem]">
                        <div className="flex flex-wrap gap-1">
                          {book.categories.slice(0, 2).map((c) => (
                            <Tag key={c.id} tone="neutral" size="sm">
                              {c.name}
                            </Tag>
                          ))}
                          {book.categories.length > 2 && (
                            <Tag tone="neutral" size="sm">
                              +{book.categories.length - 2}
                            </Tag>
                          )}
                        </div>
                      </TD>

                      {/* Availability, not two bare integers. "3 / 12" plus a
                          tone tells you at a glance whether a title is out. */}
                      <TD hideBelow="sm" align="right">
                        <span
                          data-numeric
                          className={
                            book.available === 0
                              ? "font-semibold text-red-600 dark:text-red-400"
                              : "font-medium text-gray-700 dark:text-gray-200"
                          }
                        >
                          {book.available}
                          <span className="text-gray-400"> / {book.quantity}</span>
                        </span>
                        {out > 0 && (
                          <p className="mt-0.5 text-2xs text-gray-400">{out} on loan</p>
                        )}
                      </TD>

                      <TD align="right">
                        <RowActions>
                          <IconButton
                            icon="qr"
                            tone="brand"
                            label={`QR code for ${book.title}`}
                            onClick={() => setQrBook(book)}
                          />
                          <IconButton
                            icon="edit"
                            label={`Edit ${book.title}`}
                            onClick={() => handleEdit(book)}
                          />
                          <IconButton
                            icon="trash"
                            tone="danger"
                            label={`Delete ${book.title}`}
                            onClick={() => handleDelete(book.id)}
                          />
                        </RowActions>
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </TableWrap>

        <Pagination
          page={page}
          pageSize={25}
          total={data?.booksCount ?? 0}
          onPage={(p) => setPage(p)}
        />
      </Card>

      {/* Add/Edit Book Modal */}
      <Modal
        isOpen={isFormModalOpen}
        title={isEditing ? (justCreated ? "Book Created — Add a Cover (optional)" : "Edit Book") : "Add New Book"}
        onCancel={() => {
          setIsFormModalOpen(false);
          resetForm();
        }}
        onConfirm={handleSubmit}
        confirmText={createLoading || updateLoading ? "Saving..." : "Save"}
        cancelText={justCreated ? "Done" : "Cancel"}
        confirmDisabled={createLoading || updateLoading}
        keepOpenOnConfirm={!isEditing || justCreated}
        successMessage={isEditing ? "Book updated successfully" : "Book created successfully"}
        size="lg"
      >
        <div className="space-y-4">
          {justCreated && (
            <Alert tone="success" title="Book created">
              Upload a cover image below, or choose Done to finish.
            </Alert>
          )}
          {/* ISBN auto-fill — only shown when creating a new book */}
          {!isEditing && (
            <ISBNLookup
              onData={(data) => {
                const authorNames = data.authors.filter(Boolean);
                // Open Library subjects can be long/noisy — cap at 3
                const categoryNames = data.categories.filter(Boolean).slice(0, 3);

                // Split into already-existing (pre-select immediately) vs
                // new names (defer creation until save to avoid orphans).
                const matchedAuthorIds: string[]    = [];
                const unmatchedAuthorNames: string[] = [];
                for (const name of authorNames) {
                  const hit = authors.find(a => a.name.toLowerCase() === name.toLowerCase());
                  if (hit) matchedAuthorIds.push(hit.id);
                  else unmatchedAuthorNames.push(name);
                }

                const matchedCategoryIds: string[]    = [];
                const unmatchedCategoryNames: string[] = [];
                for (const name of categoryNames) {
                  const hit = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
                  if (hit) matchedCategoryIds.push(hit.id);
                  else unmatchedCategoryNames.push(name);
                }

                setFormData(prev => ({
                  ...prev,
                  title:       data.title       || prev.title,
                  isbn:        data.isbn        || prev.isbn,
                  description: data.description || prev.description,
                  publishedAt: data.publishedAt || prev.publishedAt,
                  coverImage:  data.coverImage  || prev.coverImage,
                  pageCount:   data.pageCount   || prev.pageCount,
                  authorIds:   matchedAuthorIds.length > 0
                    ? Array.from(new Set([...prev.authorIds, ...matchedAuthorIds]))
                    : prev.authorIds,
                  categoryIds: matchedCategoryIds.length > 0
                    ? Array.from(new Set([...prev.categoryIds, ...matchedCategoryIds]))
                    : prev.categoryIds,
                }));

                setPendingAuthorNames(unmatchedAuthorNames);
                setPendingCategoryNames(unmatchedCategoryNames);

                const parts: string[] = [];
                if (matchedAuthorIds.length > 0)
                  parts.push(`${matchedAuthorIds.length} author${matchedAuthorIds.length > 1 ? 's' : ''} selected`);
                if (unmatchedAuthorNames.length > 0)
                  parts.push(`${unmatchedAuthorNames.length} new author${unmatchedAuthorNames.length > 1 ? 's' : ''} (${unmatchedAuthorNames.join(', ')}) will be created on save`);
                if (matchedCategoryIds.length > 0)
                  parts.push(`${matchedCategoryIds.length} categor${matchedCategoryIds.length > 1 ? 'ies' : 'y'} selected`);
                if (unmatchedCategoryNames.length > 0)
                  parts.push(`${unmatchedCategoryNames.length} new categor${unmatchedCategoryNames.length > 1 ? 'ies' : 'y'} (${unmatchedCategoryNames.join(', ')}) will be created on save`);
                if (parts.length > 0) addToast(parts.join(' · '), 'info');
              }}
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingInput
              id="title"
              name="title"
              label="Title"
              value={formData.title}
              onChange={handleInputChange}
              required
              error={fieldErrors.title}
            />
            <FloatingInput
              id="isbn"
              name="isbn"
              label="ISBN"
              value={formData.isbn}
              onChange={handleInputChange}
              onBlur={handleIsbnBlur}
              required
              error={fieldErrors.isbn}
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
              error={fieldErrors.publishedAt}
            />
            <FloatingInput
              id="pageCount"
              name="pageCount"
              label="Page Count"
              type="number"
              value={formData.pageCount.toString()}
              onChange={handleInputChange}
              error={fieldErrors.pageCount}
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
              error={fieldErrors.quantity}
            />
            <div>
              <p className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-gray-300">
                Cover image
              </p>
              {isEditing ? (
                <FileUpload
                  entityId={selectedBookId || ""}
                  uploadType="BOOK_COVER"
                  currentImageUrl={formData.coverImage}
                  onUploadSuccess={handleCoverImageUpdate}
                  onUploadError={(error) => setError(error)}
                  buttonLabel="Upload Cover Image"
                />
              ) : formData.coverImage ? (
                <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <img
                    src={formData.coverImage}
                    alt={`Cover for ${formData.title || "this book"}`}
                    className="h-24 w-16 shrink-0 rounded-md object-cover shadow-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-400">
                      Found by ISBN lookup. It will be saved with the book.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="close"
                      className="mt-1.5 -ml-2"
                      onClick={() => setFormData(prev => ({ ...prev, coverImage: '' }))}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  You can upload a cover once the book has been created.
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-gray-300">
              Authors
            </p>
            <div className="flex items-start gap-2">
              <select
                name="authorIds"
                aria-label="Authors"
                multiple
                value={formData.authorIds}
                onChange={handleMultiSelectChange}
                className="input min-h-[7rem] w-full py-2"
              >
                {authors.map((author) => (
                  <option key={author.id} value={author.id} className="rounded px-1 py-1">
                    {author.name}
                  </option>
                ))}
              </select>
              <Button
                icon="plus"
                onClick={handleShowAuthorCreate}
                title="Add a new author"
                className="shrink-0"
              >
                New
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Hold Ctrl (Cmd on Mac) to select more than one.
            </p>
            {pendingAuthorNames.length > 0 && (
              <p className="mt-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                Will also be created on save: {pendingAuthorNames.join(", ")}{" "}
                <button
                  type="button"
                  onClick={() => setPendingAuthorNames([])}
                  className="font-medium underline underline-offset-2 hover:no-underline"
                >
                  remove
                </button>
              </p>
            )}
          </div>

          <div>
            <p className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-gray-300">
              Categories
            </p>
            <div className="flex items-start gap-2">
              <select
                name="categoryIds"
                aria-label="Categories"
                multiple
                value={formData.categoryIds}
                onChange={handleMultiSelectChange}
                className="input min-h-[7rem] w-full py-2"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id} className="rounded px-1 py-1">
                    {category.name}
                  </option>
                ))}
              </select>
              <Button
                icon="plus"
                onClick={handleShowCategoryCreate}
                title="Add a new category"
                className="shrink-0"
              >
                New
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Hold Ctrl (Cmd on Mac) to select more than one.
            </p>
            {pendingCategoryNames.length > 0 && (
              <p className="mt-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                Will also be created on save: {pendingCategoryNames.join(", ")}{" "}
                <button
                  type="button"
                  onClick={() => setPendingCategoryNames([])}
                  className="font-medium underline underline-offset-2 hover:no-underline"
                >
                  remove
                </button>
              </p>
            )}
          </div>

          {error && <Alert tone="danger">{error}</Alert>}
        </div>
      </Modal>

      {/* Inline "Add New Author" modal — stacks on top of the book form so
          the in-progress book draft is never lost. */}
      <Modal
        isOpen={showNewAuthorModal}
        title="Add New Author"
        onCancel={() => setShowNewAuthorModal(false)}
        onConfirm={handleCreateAuthorInline}
        confirmText={creatingAuthor ? "Adding..." : "Add"}
        cancelText="Cancel"
        confirmDisabled={creatingAuthor}
        successMessage="Author added"
        size="sm"
      >
        <FloatingInput
          id="newAuthorName"
          name="newAuthorName"
          label="Author Name"
          value={newAuthorName}
          onChange={(e) => {
            setNewAuthorName(e.target.value);
            setInlineError(null);
          }}
          required
          error={inlineError || undefined}
        />
      </Modal>

      {/* Inline "Add New Category" modal — same rationale as above. */}
      <Modal
        isOpen={showNewCategoryModal}
        title="Add New Category"
        onCancel={() => setShowNewCategoryModal(false)}
        onConfirm={handleCreateCategoryInline}
        confirmText={creatingCategory ? "Adding..." : "Add"}
        cancelText="Cancel"
        confirmDisabled={creatingCategory}
        successMessage="Category added"
        size="sm"
      >
        <div className="space-y-4">
          <FloatingInput
            id="newCategoryName"
            name="newCategoryName"
            label="Category Name"
            value={newCategoryName}
            onChange={(e) => {
              setNewCategoryName(e.target.value);
              setInlineError(null);
            }}
            required
            error={inlineError || undefined}
          />
          <FloatingInput
            id="newCategoryDescription"
            name="newCategoryDescription"
            label="Description (optional)"
            value={newCategoryDescription}
            onChange={(e) => setNewCategoryDescription(e.target.value)}
          />
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

      {/* QR Code modal for a single book */}
      {qrBook && (
        <BookQRModal book={qrBook} onClose={() => setQrBook(null)} />
      )}

      {/* QR Label Sheet for all books */}
      {showLabelSheet && (
        <QRLabelSheet books={books} onClose={() => setShowLabelSheet(false)} />
      )}
    </div>
  );
};

export default BookManagement;
