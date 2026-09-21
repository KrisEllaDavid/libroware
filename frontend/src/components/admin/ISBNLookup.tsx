import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BookCover, Button, Icon, Tag, cn } from '../ui';

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

const OPEN_LIBRARY = (isbn: string) =>
  `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`;

// Small in-memory cache so re-looking-up the same ISBN (e.g. after fixing a
// typo and retrying) doesn't fire a second network request.
const lookupCache = new Map<string, BookData>();

async function fetchByISBN(isbn: string): Promise<BookData> {
  const clean = isbn.replace(/[^0-9X]/gi, '');

  const cached = lookupCache.get(clean);
  if (cached) return cached;

  const res = await fetch(OPEN_LIBRARY(clean));
  if (!res.ok) {
    if (res.status === 429) throw new Error('ratelimited');
    throw new Error('network');
  }

  const json = await res.json();
  const record = json[`ISBN:${clean}`];
  if (!record) throw new Error('notfound');

  const isbn13 = record.identifiers?.isbn_13?.[0] || record.identifiers?.isbn_10?.[0] || clean;
  const cover = record.cover?.large || record.cover?.medium || record.cover?.small || '';
  const year = (record.publish_date || '').match(/\d{4}/)?.[0] || new Date().getFullYear().toString();

  const data: BookData = {
    title:       record.title || '',
    authors:     (record.authors || []).map((a: any) => a.name),
    description: '',
    pageCount:   record.number_of_pages || 0,
    publishedAt: year,
    coverImage:  cover,
    isbn:        isbn13,
    categories:  (record.subjects || []).map((s: any) => s.name),
  };

  lookupCache.set(clean, data);
  return data;
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
                 : e.message === 'ratelimited' ? t('books.rateLimited')
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
    /*
      An assist panel, not a form section — tinted so it reads as optional help
      sitting inside the book form rather than another required field group.
    */
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="scan" size={16} className="shrink-0 text-emerald-700 dark:text-emerald-400" />
        <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          {t('books.isbnLookup')}
        </h3>
      </div>

      {/* Input row */}
      {step !== 'scanning' && (
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={isbnInput}
            onChange={e => setIsbnInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLookup()}
            placeholder={t('books.isbnPlaceholder')}
            aria-label={t('books.isbnLookup')}
            className="input flex-1 font-mono"
            disabled={step === 'loading'}
          />
          <Button
            variant="primary"
            onClick={handleLookup}
            disabled={!isbnInput.trim()}
            loading={step === 'loading'}
            className="shrink-0"
          >
            {step === 'loading' ? t('books.lookupLoading') : t('books.lookupBtn')}
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

      {/* Camera viewfinder */}
      {step === 'scanning' && (
        <div className="relative aspect-video max-h-56 overflow-hidden rounded-lg bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

          {/* Scan guide: a corner frame rather than a full box, so the barcode
              stays visible through the target area. */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-16 w-2/3">
              {['left-0 top-0 border-l-2 border-t-2',
                'right-0 top-0 border-r-2 border-t-2',
                'left-0 bottom-0 border-b-2 border-l-2',
                'right-0 bottom-0 border-b-2 border-r-2'].map((pos) => (
                <span
                  key={pos}
                  className={cn('absolute h-5 w-5 rounded-sm border-emerald-400', pos)}
                />
              ))}
            </div>
          </div>

          <p className="absolute inset-x-0 bottom-2 text-center text-xs text-white/85">
            {t('books.pointCamera')}
          </p>

          <button
            onClick={reset}
            className="absolute right-2 top-2 rounded-lg bg-gray-900/60 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-gray-900/80"
          >
            {t('common.cancel')}
          </button>
        </div>
      )}

      {/* Error */}
      {step === 'error' && (
        <Alert tone="danger" className="mt-3">
          <span className="flex flex-wrap items-center gap-2">
            {errorMsg}
            <button
              onClick={reset}
              className="font-semibold underline underline-offset-2 hover:no-underline"
            >
              {t('common.retry')}
            </button>
          </span>
        </Alert>
      )}

      {/* Preview card */}
      {step === 'preview' && preview && (
        <div className="mt-3 flex gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800 animate-scale-in">
          <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md shadow-xs">
            <BookCover
              title={preview.title}
              src={preview.coverImage}
              size="sm"
              rounded="rounded-md"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
              {preview.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
              {preview.authors.join(', ')}
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-gray-400">
              {preview.isbn} · {preview.publishedAt} · {preview.pageCount}pp
            </p>
            {preview.categories.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {preview.categories.slice(0, 2).map((c: string) => (
                  <Tag key={c} tone="brand" size="sm">{c}</Tag>
                ))}
              </div>
            )}
            <div className="mt-2.5 flex gap-2">
              <Button size="sm" variant="primary" icon="check" onClick={handleUse}>
                {t('books.useData')}
              </Button>
              <Button size="sm" onClick={reset}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!scanSupported && step === 'idle' && (
        <p className="mt-2.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {t('books.noScanSupport')}
        </p>
      )}
    </div>
  );
};

export default ISBNLookup;
