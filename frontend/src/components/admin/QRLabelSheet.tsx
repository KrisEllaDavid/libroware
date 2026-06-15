import React, { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

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

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('qr.title')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('qr.subtitle', { count: books.length })}</p>
            </div>
            <button onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-all">
              {t('qr.printAll')}
            </button>
          </div>

          {/* Scrollable preview */}
          <div className="overflow-y-auto p-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {books.map(book => (
                <div key={book.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex flex-col items-center text-center">
                  <QRCodeSVG value={book.isbn} size={100} level="M" includeMargin />
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-2 line-clamp-2 leading-tight">{book.title}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{t('browseBooks.isbnLabel')} {book.isbn}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{book.authors.map(a => a.name).join(', ')}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
              {t('qr.close')}
            </button>
          </div>
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
