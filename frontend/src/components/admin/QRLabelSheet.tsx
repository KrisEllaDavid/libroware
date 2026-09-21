import React, { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from '../ui';

interface Book {
  id: string;
  title: string;
  isbn: string;
  authors: { name: string }[];
}

interface Props {
  books: Book[];
  onClose: () => void;
}

// Inject a print stylesheet that hides everything except the label sheet
const PRINT_STYLE_ID = 'libroware-qr-print-style';

const QRLabelSheet: React.FC<Props> = ({ books, onClose }) => {
  const { t } = useTranslation();
  const sheetId = 'qr-label-sheet';

  useEffect(() => {
    // Inject print CSS
    const style = document.createElement('style');
    style.id = PRINT_STYLE_ID;
    style.innerHTML = `
      @media print {
        body > * { display: none !important; }
        #${sheetId} { display: block !important; position: fixed; inset: 0; z-index: 9999; background: white; padding: 16px; }
        #${sheetId} .no-print { display: none !important; }
        #${sheetId} .print-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        #${sheetId} .print-label { border: 1px solid #ccc; border-radius: 6px; padding: 10px; text-align: center; page-break-inside: avoid; }
        #${sheetId} .print-title { font-size: 10px; font-weight: 600; margin-top: 6px; word-break: break-word; }
        #${sheetId} .print-isbn  { font-size: 9px; color: #666; font-family: monospace; margin-top: 2px; }
        #${sheetId} .print-author { font-size: 9px; color: #888; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.getElementById(PRINT_STYLE_ID)?.remove();
    };
  }, []);

  const handlePrint = () => window.print();

  // Escape closes the sheet, matching every other dialog in the app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className="no-print fixed inset-0 z-modal flex items-end justify-center bg-gray-900/40 dark:bg-gray-950/70 sm:items-center sm:p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={t('qr.title')}
      >
        <div
          className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-2xl animate-toast-drop dark:border-gray-800 dark:bg-gray-900 sm:max-h-[85vh] sm:max-w-3xl sm:rounded-2xl sm:border"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <header className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
            <div className="min-w-0">
              <h2 className="truncate font-display text-base font-semibold tracking-tight text-gray-900 dark:text-white sm:text-lg">
                {t('qr.title')}
              </h2>
              <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                {t('qr.subtitle', { count: books.length })}
              </p>
            </div>
            <Button variant="primary" icon="print" onClick={handlePrint} className="shrink-0">
              {t('qr.printAll')}
            </Button>
          </header>

          {/* Scrollable preview. The grid matches the printed sheet's four
              columns from `sm` up, so what you see is the page you get. */}
          <div className="flex-1 overflow-y-auto overscroll-contain bg-gray-50 p-5 dark:bg-gray-950/40 sm:p-6">
            <div className="grid grid-cols-2 gap-3 xs:grid-cols-3 sm:grid-cols-4 sm:gap-4">
              {books.map(book => (
                <div
                  key={book.id}
                  className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-3 text-center shadow-xs dark:border-gray-700"
                >
                  <QRCodeSVG value={book.isbn} size={92} level="M" includeMargin />
                  <p className="mt-2 line-clamp-2 text-xs font-semibold leading-tight text-gray-900">
                    {book.title}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[0.625rem] text-gray-500">
                    {book.isbn}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[0.625rem] text-gray-400">
                    {book.authors.map(a => a.name).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <footer className="safe-bottom flex items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
            <p className="flex min-w-0 items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Icon name="info" size={13} className="shrink-0" />
              <span className="truncate">{t('qr.encodes')}</span>
            </p>
            <Button onClick={onClose} className="shrink-0">
              {t('qr.close')}
            </Button>
          </footer>
        </div>
      </div>

      {/* Print-only layer (hidden on screen, shown during window.print()) */}
      <div id={sheetId} style={{ display: 'none' }}>
        <h1 style={{ fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
          {t('qr.printHeading', { count: books.length })}
        </h1>
        <div className="print-grid">
          {books.map(book => (
            <div key={book.id} className="print-label">
              <QRCodeSVG value={book.isbn} size={120} level="M" includeMargin />
              <p className="print-title">{book.title}</p>
              <p className="print-isbn">{t('browseBooks.isbnLabel')} {book.isbn}</p>
              <p className="print-author">{book.authors.map(a => a.name).join(', ')}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default QRLabelSheet;
