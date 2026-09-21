import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CREATE_RESERVATION, CREATE_BORROW, CREATE_REVIEW, UPDATE_REVIEW, DELETE_REVIEW } from '../../graphql/mutations';
import { BOOK_REVIEWS, GET_BOOK_BY_ISBN_FULL } from '../../graphql/queries';
import { useOfflineMutation } from '../../offline/useOfflineMutation';
import { adjustBookAvailable } from '../../offline/cacheUpdates';
import { fmtShort } from '../../utils/date';
import Modal from '../Modal';
import StarRating from '../common/StarRating';
import {
  Alert,
  BookCover,
  Button,
  Card,
  CardGridSkeleton,
  EmptyState,
  ErrorState,
  Icon,
  PageHeader,
  SearchInput,
  Select,
  Spinner,
  Tag,
  Textarea,
  cn,
} from '../ui';

const GET_BOOKS = gql`
  query GetBooks {
    books {
      id title isbn description quantity available coverImage
      authors { id name }
      categories { id name }
    }
  }
`;

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

interface Review {
  id: string;
  userEmail: string;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Barcode scan panel ────────────────────────────────────────────────────────
interface ScanPanelProps {
  onIsbn: (isbn: string) => void;
  onClose: () => void;
}

const ScanPanel: React.FC<ScanPanelProps> = ({ onIsbn, onClose }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<'idle' | 'scanning' | 'loading'>('idle');
  const [isbnInput, setIsbnInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [scanSupported] = useState(() => 'BarcodeDetector' in window);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => () => stopCamera(), []);

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const scanFrame = async () => {
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    try {
      const codes = await detector.detect(video);
      if (codes.length > 0) {
        const raw = codes[0].rawValue;
        stopCamera();
        setStep('loading');
        onIsbn(raw);
        return;
      }
    } catch {}
    rafRef.current = requestAnimationFrame(scanFrame);
  };

  const startCamera = async () => {
    setStep('scanning');
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      // @ts-ignore
      detectorRef.current = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'isbn', 'code_128', 'upc_a'] });
      scanFrame();
    } catch {
      setErrorMsg(t('books.cameraDenied'));
      setStep('idle');
    }
  };

  const handleManualLookup = () => {
    if (!isbnInput.trim()) return;
    setStep('loading');
    onIsbn(isbnInput.trim());
  };

  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/30 animate-slide-down">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          <Icon name="scan" size={16} />
          {t('browseBooks.scanBook')}
        </h3>
        <button
          type="button"
          onClick={() => { stopCamera(); onClose(); }}
          aria-label={t('common.close', 'Close')}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <Icon name="close" size={15} />
        </button>
      </div>

      {step !== 'scanning' && (
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={isbnInput}
            onChange={(e) => setIsbnInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
            placeholder={t('books.isbnPlaceholder')}
            aria-label={t('books.isbnPlaceholder')}
            className="input flex-1 font-mono"
            disabled={step === 'loading'}
          />
          <Button
            variant="primary"
            onClick={handleManualLookup}
            disabled={!isbnInput.trim()}
            loading={step === 'loading'}
            className="shrink-0"
          >
            {t('books.lookupBtn')}
          </Button>
          {scanSupported && (
            <Button
              icon="scan"
              onClick={startCamera}
              disabled={step === 'loading'}
              title={t('books.scanTitle')}
              aria-label={t('books.scanTitle')}
              className="shrink-0 px-3"
            />
          )}
        </div>
      )}

      {step === 'scanning' && (
        <div className="relative aspect-video max-h-56 overflow-hidden rounded-lg bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

          {/* Corner frame keeps the barcode itself visible inside the target. */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-16 w-2/3">
              {['left-0 top-0 border-l-2 border-t-2',
                'right-0 top-0 border-r-2 border-t-2',
                'left-0 bottom-0 border-b-2 border-l-2',
                'right-0 bottom-0 border-b-2 border-r-2'].map((pos) => (
                <span key={pos} className={cn('absolute h-5 w-5 rounded-sm border-emerald-400', pos)} />
              ))}
            </div>
          </div>

          <p className="absolute inset-x-0 bottom-2 text-center text-xs text-white/85">
            {t('books.pointCamera')}
          </p>

          <button
            onClick={() => { stopCamera(); setStep('idle'); }}
            className="absolute right-2 top-2 rounded-lg bg-gray-900/60 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-gray-900/80"
          >
            {t('common.cancel')}
          </button>
        </div>
      )}

      {errorMsg && <Alert tone="danger" className="mt-3">{errorMsg}</Alert>}

      {!scanSupported && step === 'idle' && (
        <p className="mt-2.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {t('books.noScanSupport')}
        </p>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
interface UserBookViewProps {
  /**
   * Rendered inside the member dashboard's tab strip, which already
   * provides the page shell and heading.
   */
  embedded?: boolean;
}

const UserBookView: React.FC<UserBookViewProps> = ({ embedded = false }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addToast } = useToast();

  const getDueDate = (days = 7) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    return twoWeeks.toISOString().split('T')[0];
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [borrowType, setBorrowType] = useState<'BORROW' | 'READ'>('BORROW');
  const [note, setNote] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedDueDate, setSelectedDueDate] = useState<Date>(new Date(getDueDate(7)));
  const [showScanPanel, setShowScanPanel] = useState(false);
  const [scanError, setScanError] = useState('');

  const { loading, error, data, refetch } = useQuery(GET_BOOKS);

  // ISBN lookup for scan — only fires when scannedIsbn is set
  const [scannedIsbn, setScannedIsbn] = useState('');
  const { loading: isbnLoading } = useQuery(GET_BOOK_BY_ISBN_FULL, {
    variables: { isbn: scannedIsbn },
    skip: !scannedIsbn,
    fetchPolicy: 'network-only',
    onCompleted: (d: any) => {
      setScannedIsbn('');
      const book = d?.bookByIsbn;
      if (!book) {
        setScanError(t('browseBooks.scanNotInCatalog'));
        return;
      }
      setScanError('');
      setShowScanPanel(false);
      handleBookSelect(book, 'BORROW');
    },
    onError: () => {
      setScannedIsbn('');
      setScanError(t('books.networkError'));
    },
  } as any);

  const handleScanIsbn = (isbn: string) => {
    setScanError('');
    // First try to find in already-loaded books (no extra request)
    if (data?.books) {
      const clean = isbn.replace(/[^0-9X]/gi, '');
      const found = data.books.find((b: Book) =>
        b.isbn.replace(/[^0-9X]/gi, '') === clean
      );
      if (found) {
        setShowScanPanel(false);
        setScanError('');
        handleBookSelect(found, 'BORROW');
        return;
      }
    }
    // Fall back to network query
    setScannedIsbn(isbn);
  };

  const [createBorrow, { loading: borrowLoading }] = useOfflineMutation(CREATE_BORROW, {
    type: 'CREATE_BORROW',
    applyOptimistic: (cache, variables: { input: BorrowInput }) =>
      adjustBookAvailable(cache, variables.input.bookId, -1),
    queuedMessage: t('browseBooks.borrowQueued'),
  }, {
    onCompleted: (d: any) => {
      const status = d?.createBorrow?.status;
      if (status === 'PENDING_APPROVAL') {
        addToast(t('browseBooks.requestSubmitted'), 'info');
      }
      setShowModal(false);
      setSelectedBook(null);
      setBorrowType('BORROW');
      setNote('');
      refetch();
    },
    onError: (error: any) => { setSubmitError(error.message); },
    onQueued: () => {
      setShowModal(false);
      setSelectedBook(null);
      setBorrowType('BORROW');
      setNote('');
    },
  });

  const [createReservation] = useMutation(CREATE_RESERVATION, {
    onCompleted: () => addToast(t('browseBooks.reservationCreated'), 'success'),
    onError: (e: any) => addToast(e.message, 'error'),
  });

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  const { data: reviewsData, refetch: refetchReviews } = useQuery<{ bookReviews: Review[] }>(BOOK_REVIEWS, {
    variables: { bookId: selectedBook?.id },
    skip: !selectedBook,
  });

  const reviews = reviewsData?.bookReviews || [];
  const myReview = reviews.find((r) => r.userEmail === user?.email);
  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  useEffect(() => {
    setReviewRating(myReview?.rating || 0);
    setReviewComment(myReview?.comment || '');
  }, [selectedBook?.id, myReview?.id, myReview?.rating, myReview?.comment]);

  const [createReview] = useMutation(CREATE_REVIEW, {
    onCompleted: () => { addToast(t('reviews.posted'), 'success'); refetchReviews(); },
    onError: (e: any) => addToast(e.message, 'error'),
  });

  const [updateReview] = useMutation(UPDATE_REVIEW, {
    onCompleted: () => { addToast(t('reviews.updated'), 'success'); refetchReviews(); },
    onError: (e: any) => addToast(e.message, 'error'),
  });

  const [deleteReview] = useMutation(DELETE_REVIEW, {
    onCompleted: () => {
      addToast(t('reviews.removed'), 'success');
      setReviewRating(0);
      setReviewComment('');
      refetchReviews();
    },
    onError: (e: any) => addToast(e.message, 'error'),
  });

  const handleSubmitReview = () => {
    if (!selectedBook || reviewRating < 1) return;
    if (myReview) {
      updateReview({ variables: { id: myReview.id, input: { rating: reviewRating, comment: reviewComment.trim() || undefined } } });
    } else {
      createReview({ variables: { input: { bookId: selectedBook.id, rating: reviewRating, comment: reviewComment.trim() || undefined } } });
    }
  };

  const handleBookSelect = (book: Book, type: 'BORROW' | 'READ') => {
    setSelectedBook(book);
    setBorrowType(type);
    setShowModal(true);
    setSubmitError('');
    setSelectedDueDate(new Date(getDueDate(7)));
  };

  const handleSubmit = () => {
    if (!user?.id || !selectedBook) return;
    const dueDate = new Date();
    if (borrowType === 'BORROW') {
      dueDate.setTime(selectedDueDate.getTime());
    } else {
      dueDate.setHours(23, 59, 59, 999);
    }
    createBorrow({ variables: { input: { userId: user.id, bookId: selectedBook.id, note: note.trim() || undefined, dueDate: dueDate.toISOString() } } });
  };

  const getFilteredBooks = () => {
    if (!data?.books) return [];
    return data.books
      .filter((book: Book) => {
        const matchesSearch = searchTerm === '' ||
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.authors.some((a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategory === '' ||
          book.categories.some((c) => c.id === selectedCategory);
        return matchesSearch && matchesCategory;
      })
      .sort((a: Book, b: Book) => a.title.localeCompare(b.title));
  };

  const getCategories = () => {
    if (!data?.books) return [];
    const map = new Map<string, string>();
    data.books.forEach((book: Book) =>
      book.categories.forEach((c) => map.set(c.id, c.name))
    );
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const filteredBooks = getFilteredBooks();
  const categories = getCategories();

  const toolbar = (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder={t('browseBooks.search')}
          wrapperClassName="flex-1"
        />

        <Select
          aria-label={t('browseBooks.allCats')}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          wrapperClassName="sm:w-56"
        >
          <option value="">{t('browseBooks.allCats')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>

        <Button
          icon="scan"
          variant={showScanPanel ? 'primary' : 'secondary'}
          onClick={() => { setShowScanPanel(!showScanPanel); setScanError(''); }}
          aria-expanded={showScanPanel}
          className="shrink-0"
        >
          {t('browseBooks.scanBook')}
        </Button>
      </div>

      {showScanPanel && (
        <ScanPanel
          onIsbn={handleScanIsbn}
          onClose={() => { setShowScanPanel(false); setScanError(''); }}
        />
      )}

      {isbnLoading && (
        <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
          <Spinner size={15} />
          {t('browseBooks.scanLooking')}
        </p>
      )}

      {scanError && <Alert tone="danger">{scanError}</Alert>}
    </div>
  );

  const grid = loading ? (
    <CardGridSkeleton count={8} />
  ) : error ? (
    <Card>
      <ErrorState
        message={t('browseBooks.errorLoading', { message: error.message })}
        onRetry={() => refetch()}
      />
    </Card>
  ) : filteredBooks.length === 0 ? (
    <Card>
      <EmptyState
        icon="search"
        title={t('browseBooks.noBooks')}
        description={
          searchTerm || selectedCategory
            ? t('browseBooks.noBooksHint', 'Try a different title, author or category.')
            : undefined
        }
        action={
          searchTerm || selectedCategory ? (
            <Button
              variant="secondary"
              icon="close"
              onClick={() => { setSearchTerm(''); setSelectedCategory(''); }}
            >
              {t('browseBooks.clearFilters', 'Clear filters')}
            </Button>
          ) : undefined
        }
      />
    </Card>
  ) : (
    /*
      The shelf. Cover art gets a fixed 2:3 aspect box so the grid stays on a
      rhythm whatever the source image is, and the two actions are pinned to
      the card's foot with `mt-auto` — otherwise a long title pushes one card's
      buttons a row lower than its neighbour's.
    */
    <ul className="stagger grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {filteredBooks.map((book: Book, i: number) => (
        <li key={book.id} style={{ ['--i' as any]: i }}>
          <Card interactive className="flex h-full flex-col overflow-hidden">
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
              <BookCover
                title={book.title}
                src={book.coverImage}
                author={book.authors.map((a) => a.name).join(', ')}
                rounded="rounded-none"
              />
              {book.available === 0 && (
                <span className="absolute left-2 top-2">
                  <Tag tone="danger" size="sm">{t('browseBooks.currentlyUnavailable')}</Tag>
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col p-3.5 sm:p-4">
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-white">
                {book.title}
              </h3>
              <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                {book.authors.map((a) => a.name).join(', ')}
              </p>

              {book.categories.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {book.categories.slice(0, 2).map((c) => (
                    <Tag key={c.id} tone="neutral" size="sm">{c.name}</Tag>
                  ))}
                </div>
              )}

              <p className="mt-2.5 text-xs text-gray-500 dark:text-gray-400">
                <span
                  data-numeric
                  className={cn(
                    'font-semibold',
                    book.available > 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {book.available}
                </span>{' '}
                {t('browseBooks.of')} {book.quantity} {t('browseBooks.available').toLowerCase()}
              </p>

              <div className="mt-auto pt-3">
                {book.available > 0 ? (
                  <div className="flex flex-col gap-2 xl:flex-row">
                    <Button
                      variant="primary"
                      size="sm"
                      block
                      onClick={() => handleBookSelect(book, 'BORROW')}
                    >
                      {t('reservations.borrow')}
                    </Button>
                    <Button
                      size="sm"
                      block
                      onClick={() => handleBookSelect(book, 'READ')}
                    >
                      {t('reservations.read')}
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    block
                    icon="bookmark"
                    onClick={() => createReservation({ variables: { bookId: book.id } })}
                  >
                    {t('reservations.reserve')}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );

  const body = (
    <div className="space-y-5">
      {toolbar}
      {grid}
    </div>
  );

  return (
    <>
      {embedded ? (
        body
      ) : (
        <div className="app-shell page">
          <PageHeader
            icon="books"
            eyebrow={t('userDashboard.title')}
            title={t('browseBooks.title')}
            description={t(
              'browseBooks.subtitle',
              'Search the catalogue, borrow what is on the shelf and reserve what is out.'
            )}
          />
          {body}
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
          confirmText={
            borrowLoading
              ? t('borrows.processing')
              : borrowType === 'READ'
              ? t('browseBooks.readNow')
              : t('reservations.borrow')
          }
          onConfirm={handleSubmit}
        >
          <Alert tone="warning" className="mb-4">
            {t('browseBooks.approvalNotice')}
          </Alert>

          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="mx-auto w-32 shrink-0 sm:mx-0 sm:w-40">
              <div className="aspect-[2/3] overflow-hidden rounded-lg shadow-md">
                <BookCover
                  title={selectedBook?.title ?? ''}
                  src={selectedBook?.coverImage}
                  author={selectedBook?.authors?.map((a) => a.name).join(', ')}
                  size="lg"
                  rounded="rounded-lg"
                />
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <h3 className="break-words font-display text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                  {selectedBook?.title}
                </h3>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  {selectedBook?.authors?.map((a) => a.name).join(', ')}
                </p>
              </div>

              {/* A definition list, so label and value stay paired when the
                  values wrap — the old run of <p> collapsed into a paragraph
                  on narrow screens. */}
              <dl className="space-y-1.5 border-y border-gray-100 py-3 text-sm dark:border-gray-800">
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-gray-500 dark:text-gray-400">
                    {t('browseBooks.isbnLabel')}
                  </dt>
                  <dd className="min-w-0 break-all font-mono text-xs text-gray-700 dark:text-gray-200">
                    {selectedBook?.isbn}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-gray-500 dark:text-gray-400">
                    {t('browseBooks.categoriesLabel')}
                  </dt>
                  <dd className="flex min-w-0 flex-wrap gap-1">
                    {selectedBook?.categories?.length
                      ? selectedBook.categories.map((c) => (
                          <Tag key={c.id} tone="neutral" size="sm">{c.name}</Tag>
                        ))
                      : '—'}
                  </dd>
                </div>
                {selectedBook?.available !== undefined && (
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-gray-500 dark:text-gray-400">
                      {t('browseBooks.available')}
                    </dt>
                    <dd data-numeric className="font-medium text-gray-700 dark:text-gray-200">
                      {selectedBook.available} {t('browseBooks.of')} {selectedBook.quantity}
                      {selectedBook.available === 0 && (
                        <span className="ml-2 font-normal text-red-600 dark:text-red-400">
                          {t('browseBooks.currentlyUnavailable')}
                        </span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>

              <Textarea
                id="note"
                label={t('browseBooks.notesLabel')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder={t('browseBooks.notesPlaceholder')}
              />

              {borrowType === 'BORROW' && (
                <div>
                  <label
                    htmlFor="dueDate"
                    className="mb-1.5 block text-[0.8125rem] font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t('browseBooks.returnByLabel')}
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    value={selectedDueDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDueDate(new Date(e.target.value))}
                    className="input"
                    min={getMinDate()}
                    max={getMaxDate()}
                  />
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {t('browseBooks.borrowPeriodHint')}
                  </p>
                </div>
              )}

              {submitError && <Alert tone="danger">{submitError}</Alert>}
            </div>
          </div>

          {/* Reviews section */}
          <div className="mt-6 border-t border-gray-200 pt-5 dark:border-gray-800">
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h4 className="font-display text-base font-semibold tracking-tight text-gray-900 dark:text-white">
                {t('reviews.title')}
              </h4>
              {reviews.length > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <StarRating value={avgRating} size="sm" />
                  <span data-numeric className="font-medium text-gray-700 dark:text-gray-200">
                    {avgRating.toFixed(1)}
                  </span>
                  <span>({t('reviews.count', { count: reviews.length })})</span>
                </span>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-700 dark:bg-gray-800/60">
              <p className="mb-2 text-[0.8125rem] font-medium text-gray-700 dark:text-gray-300">
                {myReview ? t('reviews.yourReview') : t('reviews.leaveReview')}
              </p>
              <StarRating value={reviewRating} onChange={setReviewRating} />
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder={t('reviews.commentPlaceholder')}
                className="mt-2.5"
              />
              <div className="mt-2.5 flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSubmitReview}
                  disabled={reviewRating < 1}
                >
                  {myReview ? t('reviews.update') : t('reviews.post')}
                </Button>
                {myReview && (
                  <Button
                    size="sm"
                    icon="trash"
                    onClick={() => deleteReview({ variables: { id: myReview.id } })}
                    className="text-red-600 hover:border-red-300 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                  >
                    {t('common.delete')}
                  </Button>
                )}
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t('reviews.empty')}</p>
            ) : (
              <ul className="mt-3 max-h-56 space-y-3 overflow-y-auto overscroll-contain">
                {reviews.map((review) => (
                  <li
                    key={review.id}
                    className="border-b border-gray-100 pb-3 text-sm last:border-0 last:pb-0 dark:border-gray-800"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-gray-800 dark:text-white">
                        {review.userName}
                      </span>
                      <StarRating value={review.rating} size="sm" />
                    </div>
                    {review.comment && (
                      <p className="mt-1 leading-relaxed text-gray-600 dark:text-gray-300">
                        {review.comment}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {fmtShort(review.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default UserBookView;
