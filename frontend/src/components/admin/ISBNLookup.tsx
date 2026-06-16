import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface BookData {
  title: string;
  authors: string[];
  description: string;
  pageCount: number;
  publishedAt: string;
  coverImage: string;
  isbn: string;
  categories: string[];
}

interface Props {
  onData: (data: BookData) => void;
}

type Step = 'idle' | 'scanning' | 'loading' | 'preview' | 'error';

const GOOGLE_BOOKS = (isbn: string) =>
  `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`;

async function fetchByISBN(isbn: string): Promise<BookData> {
  const clean = isbn.replace(/[^0-9X]/gi, '');
  const res = await fetch(GOOGLE_BOOKS(clean));
  if (!res.ok) throw new Error('network');
  const json = await res.json();
  if (!json.totalItems) throw new Error('notfound');

  const info = json.items[0].volumeInfo;
  const isbn13 = info.industryIdentifiers?.find((i: any) => i.type === 'ISBN_13')?.identifier
               || info.industryIdentifiers?.[0]?.identifier
               || clean;

  // Attempt to get a larger cover image (strip zoom parameter)
  const cover = (info.imageLinks?.extraLarge
    || info.imageLinks?.large
    || info.imageLinks?.medium
    || info.imageLinks?.thumbnail
    || ''
  ).replace('http://', 'https://').replace('&edge=curl', '');

  const rawDate = info.publishedDate || '';
  const year = rawDate.slice(0, 4) || new Date().getFullYear().toString();

  return {
    title:       info.title || '',
    authors:     info.authors || [],
    description: info.description || '',
    pageCount:   info.pageCount || 0,
    publishedAt: year,
    coverImage:  cover,
    isbn:        isbn13,
    categories:  info.categories || [],
  };
}

const ISBNLookup: React.FC<Props> = ({ onData }) => {
  const { t } = useTranslation();
  const [step, setStep]         = useState<Step>('idle');
  const [isbnInput, setIsbnInput] = useState('');
  const [preview, setPreview]   = useState<BookData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [scanSupported]         = useState(() => 'BarcodeDetector' in window);
  const videoRef                = useRef<HTMLVideoElement>(null);
  const streamRef               = useRef<MediaStream | null>(null);
  const detectorRef             = useRef<any>(null);
  const rafRef                  = useRef<number>(0);

  // Cleanup camera on unmount
  useEffect(() => () => stopCamera(), []);

  const lookup = async (isbn: string) => {
    setStep('loading');
    setErrorMsg('');
    try {
      const data = await fetchByISBN(isbn);
      setPreview(data);
      setStep('preview');
    } catch (e: any) {
      const msg = e.message === 'network' ? t('books.networkError')
                 : e.message === 'notfound' ? t('books.noBookFound')
                 : t('books.lookupFailed');
      setErrorMsg(msg);
      setStep('error');
    }
  };

  const handleLookup = () => {
    if (!isbnInput.trim()) return;
    lookup(isbnInput.trim());
  };

  // ── Camera scanner ─────────────────────────────────────────────────────────
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
      // @ts-ignore — BarcodeDetector is not yet in TypeScript lib
      detectorRef.current = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'isbn', 'code_128', 'upc_a'] });
      scanFrame();
    } catch (e: any) {
      setErrorMsg(t('books.cameraDenied'));
      setStep('error');
    }
  };

  const scanFrame = async () => {
    const video    = videoRef.current;
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
        setIsbnInput(raw);
        lookup(raw);
        return;
      }
    } catch {}
    rafRef.current = requestAnimationFrame(scanFrame);
  };

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const handleUse = () => {
    if (preview) onData(preview);
  };

  const reset = () => {
    stopCamera();
    setStep('idle');
    setPreview(null);
    setErrorMsg('');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t('books.isbnLookup')}</span>
      </div>

      {/* Input row */}
      {step !== 'scanning' && (
        <div className="flex gap-2">
          <input
            type="text"
            value={isbnInput}
            onChange={e => setIsbnInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLookup()}
            placeholder={t('books.isbnPlaceholder')}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={step === 'loading'}
          />
          <button
            onClick={handleLookup}
            disabled={!isbnInput.trim() || step === 'loading'}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg disabled:opacity-50 transition-all font-medium"
          >
            {step === 'loading' ? t('books.lookupLoading') : t('books.lookupBtn')}
          </button>
          {scanSupported && (
            <button
              onClick={startCamera}
              disabled={step === 'loading'}
              className="px-3 py-2 border border-emerald-500 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50 transition-all"
              title={t('books.scanTitle')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3m12-4v3a1 1 0 01-1 1h-3M21 9V6a1 1 0 00-1-1h-3M8 12h8" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Camera viewfinder */}
      {step === 'scanning' && (
        <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-h-56">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {/* Scan guide overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-emerald-400 rounded-sm w-2/3 h-16 opacity-80" />
          </div>
          <div className="absolute bottom-2 left-0 right-0 text-center text-white text-xs opacity-80">
            {t('books.pointCamera')}
          </div>
          <button
            onClick={reset}
            className="absolute top-2 right-2 bg-black/50 text-white text-xs px-5 py-1 rounded hover:bg-black/70 transition-all"
          >
            {t('common.cancel')}
          </button>
        </div>
      )}

      {/* Error */}
      {step === 'error' && (
        <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          <span className="text-sm text-red-600 dark:text-red-400">{errorMsg}</span>
          <button onClick={reset} className="text-xs text-red-500 hover:text-red-700 ml-2">{t('common.retry')}</button>
        </div>
      )}

      {/* Preview card */}
      {step === 'preview' && preview && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex gap-3">
          {preview.coverImage && (
            <img src={preview.coverImage} alt={preview.title}
              className="w-14 h-20 object-cover rounded flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">{preview.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{preview.authors.join(', ')}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{preview.isbn} · {preview.publishedAt} · {preview.pageCount}pp</p>
            {preview.categories.length > 0 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{preview.categories.slice(0, 2).join(', ')}</p>
            )}
            <div className="flex gap-2 mt-2">
              <button onClick={handleUse}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-md font-medium transition-all">
                {t('books.useData')}
              </button>
              <button onClick={reset}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {!scanSupported && step === 'idle' && (
        <p className="text-xs text-gray-400">
          {t('books.noScanSupport')}
        </p>
      )}
    </div>
  );
};

export default ISBNLookup;
