import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import { Icon } from '../ui';

interface Props {
  book: {
    id: string;
    title: string;
    isbn: string;
    authors: { name: string }[];
  };
  onClose: () => void;
}

/**
 * Shelf label for a single title.
 *
 * Built on the shared Modal rather than its own fixed overlay, so it gets the
 * escape key, the focus trap, the scroll lock and the mobile sheet behaviour
 * the rest of the app's dialogs have.
 */
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
    <Modal
      isOpen
      size="sm"
      type="form"
      title={t('qr.title', 'Shelf label')}
      confirmText={t('qr.print')}
      cancelText={t('qr.close')}
      showToast={false}
      onConfirm={handlePrint}
      onCancel={onClose}
      keepOpenOnConfirm
    >
      <div className="flex flex-col items-center gap-4">
        <p className="text-center text-sm font-medium text-gray-900 dark:text-white">
          {book.title}
        </p>

        {/* The QR sits on a permanently white card even in dark mode: the code
            has to stay high-contrast for a scanner, and this is exactly what
            gets sent to the printer. */}
        <div
          ref={printRef}
          className="label rounded-xl border border-gray-200 bg-white p-4 text-center shadow-xs dark:border-gray-700"
        >
          <QRCodeSVG
            value={book.isbn}
            size={168}
            level="M"
            includeMargin
            style={{ display: 'block', margin: '0 auto' }}
          />
          <p className="title mt-2.5 break-words text-[13px] font-semibold text-gray-900">
            {book.title}
          </p>
          <p className="isbn mt-1 font-mono text-[11px] text-gray-500">
            {t('browseBooks.isbnLabel')} {book.isbn}
          </p>
        </div>

        <p className="flex items-center gap-1.5 text-center text-xs text-gray-500 dark:text-gray-400">
          <Icon name="info" size={13} className="shrink-0" />
          {t('qr.encodes')}
        </p>
      </div>
    </Modal>
  );
};

export default BookQRModal;
