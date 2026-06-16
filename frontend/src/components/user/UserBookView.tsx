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
    <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          {t('browseBooks.scanBook')}
        </span>
        <button onClick={() => { stopCamera(); onClose(); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {step !== 'scanning' && (
        <div className="flex gap-2">
          <input
            type="text"
            value={isbnInput}
            onChange={(e) => setIsbnInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
            placeholder={t('books.isbnPlaceholder')}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={step === 'loading'}
          />
          <button
            onClick={handleManualLookup}
            disabled={!isbnInput.trim() || step === 'loading'}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg disabled:opacity-50 font-medium"
          >
            {step === 'loading' ? t('common.loading') : t('books.lookupBtn')}
          </button>
          {scanSupported && (
            <button
              onClick={startCamera}
              disabled={step === 'loading'}
              className="px-3 py-2 border border-emerald-500 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50"
              title={t('books.scanTitle')}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3m12-4v3a1 1 0 01-1 1h-3M21 9V6a1 1 0 00-1-1h-3M8 12h8" />
              </svg>
            </button>
          )}
        </div>
      )}

      {step === 'scanning' && (
        <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-h-56">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-emerald-400 rounded-sm w-2/3 h-16 opacity-80" />
          </div>
          <div className="absolute bottom-2 left-0 right-0 text-center text-white text-xs opacity-80">
            {t('books.pointCamera')}
          </div>
          <button
            onClick={() => { stopCamera(); setStep('idle'); }}
            className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded hover:bg-black/70"
          >
            {t('common.cancel')}
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {errorMsg}
        </div>
      )}

      {!scanSupported && step === 'idle' && (
        <p className="text-xs text-gray-400">{t('books.noScanSupport')}</p>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
const UserBookView: React.FC = () => {
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

  if (loading) return <div className="p-4 text-center">{t('browseBooks.loading')}</div>;
  if (error) return <div className="p-4 text-red-500">{t('browseBooks.errorLoading', { message: error.message })}</div>;

  const filteredBooks = getFilteredBooks();
  const categories = getCategories();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{t('browseBooks.title')}</h1>

      {/* Search, filter, and scan */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder={t('browseBooks.search')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="md:w-52">
          <select
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">{t('browseBooks.allCats')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => { setShowScanPanel(!showScanPanel); setScanError(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md border font-medium text-sm transition-all ${
            showScanPanel
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3m12-4v3a1 1 0 01-1 1h-3M21 9V6a1 1 0 00-1-1h-3M8 12h8" />
          </svg>
          {t('browseBooks.scanBook')}
        </button>
      </div>

      {/* Scan panel */}
      {showScanPanel && (
        <ScanPanel
          onIsbn={handleScanIsbn}
          onClose={() => { setShowScanPanel(false); setScanError(''); }}
        />
      )}

      {/* Scan state feedback */}
      {isbnLoading && (
        <div className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-r-transparent" />
          {t('browseBooks.scanLooking')}
        </div>
      )}
      {scanError && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">{scanError}</div>
      )}

      {/* Books grid */}
      <div className="mt-6">
        {filteredBooks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('browseBooks.noBooks')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredBooks.map((book: Book) => (
              <div key={book.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="h-48 overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {book.coverImage ? (
                    <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-400 dark:text-gray-500 text-center p-4">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {t('browseBooks.noCoverImage')}
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 line-clamp-2">{book.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{book.authors.map((a) => a.name).join(', ')}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {book.categories.map((c) => (
                      <span key={c.id} className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                        {c.name}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1 line-clamp-2">
                    {book.description || t('browseBooks.noDescription')}
                  </p>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    <span className="font-medium">{t('browseBooks.available')}:</span> {book.available} {t('browseBooks.of')} {book.quantity}
                  </div>
                  <div className="flex space-x-2 mt-auto">
                    {book.available > 0 ? (
                      <>
                        <button onClick={() => handleBookSelect(book, 'BORROW')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition-all text-sm">
                          {t('reservations.borrow')}
                        </button>
                        <button onClick={() => handleBookSelect(book, 'READ')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all text-sm">
                          {t('reservations.read')}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => createReservation({ variables: { bookId: book.id } })}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 transition-all text-sm"
                      >
                        {t('reservations.reserve')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
          {/* Pending-approval notice */}
          <div className="mb-4 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-amber-700 dark:text-amber-300">{t('browseBooks.approvalNotice')}</p>
          </div>

          <div className="flex flex-col md:flex-row md:space-x-6">
            <div className="flex-shrink-0 mx-auto sm:mx-0 mb-4 md:mb-0">
              <img
                src={selectedBook?.coverImage || '/default-book-cover.jpg'}
                alt={`Cover of ${selectedBook?.title}`}
                className="rounded-lg object-cover shadow-md"
                style={{ maxWidth: '160px' }}
              />
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 break-words">{selectedBook?.title}</h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                <p><span className="font-medium">{t('browseBooks.authorsLabel')}</span> {selectedBook?.authors?.map((a) => a.name).join(', ')}</p>
                <p><span className="font-medium">{t('browseBooks.isbnLabel')}</span> {selectedBook?.isbn}</p>
                <p><span className="font-medium">{t('browseBooks.categoriesLabel')}</span> {selectedBook?.categories?.map((c) => c.name).join(', ')}</p>
                {selectedBook?.available !== undefined && (
                  <p>
                    <span className="font-medium">{t('browseBooks.available')}:</span> {selectedBook?.available}
                    {selectedBook.available === 0 && <span className="text-red-500 ml-2">{t('browseBooks.currentlyUnavailable')}</span>}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('browseBooks.notesLabel')}
                </label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder={t('browseBooks.notesPlaceholder')}
                />
              </div>

              {borrowType === 'BORROW' && (
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('browseBooks.returnByLabel')}
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    value={selectedDueDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDueDate(new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    min={getMinDate()}
                    max={getMaxDate()}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('browseBooks.borrowPeriodHint')}</p>
                </div>
              )}

              {submitError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{submitError}</p>}
            </div>
          </div>

          {/* Reviews section */}
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              {t('reviews.title')}
              {reviews.length > 0 && (
                <span className="flex items-center gap-1 text-sm font-normal text-gray-600 dark:text-gray-300">
                  <StarRating value={avgRating} size="sm" />
                  {avgRating.toFixed(1)} ({t('reviews.count', { count: reviews.length })})
                </span>
              )}
            </h4>
            <div className="mb-4 p-3 rounded-md bg-gray-50 dark:bg-gray-700/50">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {myReview ? t('reviews.yourReview') : t('reviews.leaveReview')}
              </p>
              <StarRating value={reviewRating} onChange={setReviewRating} />
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder={t('reviews.commentPlaceholder')}
                className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white text-sm"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={reviewRating < 1}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md disabled:opacity-50"
                >
                  {myReview ? t('reviews.update') : t('reviews.post')}
                </button>
                {myReview && (
                  <button
                    type="button"
                    onClick={() => deleteReview({ variables: { id: myReview.id } })}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 dark:border-red-700 rounded-md disabled:opacity-50"
                  >
                    {t('common.delete')}
                  </button>
                )}
              </div>
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('reviews.empty')}</p>
            ) : (
              <ul className="space-y-3 max-h-48 overflow-y-auto">
                {reviews.map((review) => (
                  <li key={review.id} className="text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800 dark:text-white">{review.userName}</span>
                      <StarRating value={review.rating} size="sm" />
                    </div>
                    {review.comment && <p className="mt-1 text-gray-600 dark:text-gray-300">{review.comment}</p>}
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
    </div>
  );
};

export default UserBookView;
