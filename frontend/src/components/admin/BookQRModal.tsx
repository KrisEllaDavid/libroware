import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

interface Props {
  book: {
    id: string;
    title: string;
    isbn: string;
    authors: { name: string }[];
  };
  onClose: () => void;
}

const BookQRModal: React.FC<Props> = ({ book, onClose }) => {
  const { t } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=400,height=500');
    if (!win) return;
    win.document.write(`
      <html><head><title>QR — ${book.title}</title>
      <style>
        body { font-family: sans-serif; display:flex; justify-content:center; align-items:center; min-height:100vh; margin:0; }
        .label { text-align:center; padding:20px; border:1px solid #ccc; border-radius:8px; width:220px; }
        .title { font-size:13px; font-weight:600; margin-top:10px; word-break:break-word; }
        .isbn  { font-size:11px; color:#666; margin-top:4px; font-family:monospace; }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-72 flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white text-center">{book.title}</h2>

        {/* QR code */}
        <div ref={printRef} className="label text-center">
          <QRCodeSVG
            value={book.isbn}
            size={180}
            level="M"
            includeMargin
            style={{ display: 'block', margin: '0 auto' }}
          />
          <p className="title">{book.title}</p>
          <p className="isbn">{t('browseBooks.isbnLabel')} {book.isbn}</p>
        </div>

        <p className="text-xs text-gray-400 text-center">{t('qr.encodes')}</p>

        <div className="flex gap-3 w-full">
          <button onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            {t('qr.close')}
          </button>
          <button onClick={handlePrint}
            className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all">
            {t('qr.print')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookQRModal;
