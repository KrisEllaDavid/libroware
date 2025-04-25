import React, { useEffect, useRef, useId } from 'react';
import ReactDOM from 'react-dom';
import { useToast } from '../context/ToastContext';

interface ModalProps {
  isOpen: boolean;
  title?: React.ReactNode;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: React.ReactNode;
  type?: "success" | "warning" | "danger" | "info" | "confirm" | "form" | "delete";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showToast?: boolean;
  successMessage?: string;
  cancelMessage?: string;
  entityName?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  children,
  type = 'info',
  size = 'md',
  showToast = true,
  successMessage,
  cancelMessage,
  entityName = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const modalId = useId();
  const { addToast } = useToast();

  // Extract entity name from title if not provided directly
  const getEntityName = () => {
    if (entityName) return entityName;
    
    // Try to extract from title if it's a string
    if (typeof title === 'string') {
      // Check for common patterns like "Delete User", "Edit Book", etc.
      const matches = title.match(/(?:Delete|Edit|Add|Create)\s+(\w+)/i);
      if (matches && matches[1]) {
        return matches[1]; // Return the captured entity name
      }
    }
    
    return 'Item'; // Default fallback
  };

  // Generate a specific success message based on action and entity
  const generateSuccessMessage = () => {
    const entity = getEntityName();
    
    if (successMessage) return successMessage;
    
    if (type === 'delete') {
      return `${entity} deleted successfully`;
    } else if (type === 'form') {
      if (confirmText.includes('Add') || confirmText.includes('Create')) {
        return `${entity} created successfully`;
      } else if (confirmText.includes('Edit') || confirmText.includes('Update')) {
        return `${entity} updated successfully`;
      } else {
        return `${entity} saved successfully`;
      }
    } else {
      return `Action completed successfully`;
    }
  };

  // Handle confirm action with toast notification
  const handleConfirm = () => {
    // First close the modal
    if (onCancel) {
      onCancel();
    }
    
    // Then perform the action
    if (onConfirm) {
      onConfirm();
      
      // Show a single specific toast notification if enabled
      if (showToast) {
        const specificMessage = generateSuccessMessage();
        
        // Use success type for all confirmations
        setTimeout(() => {
          addToast(specificMessage, 'success');
        }, 100);
      }
    }
  };

  // Handle cancel action with toast notification
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      
      // Show toast notification for cancel if enabled and message provided
      if (showToast && cancelMessage) {
        // Short delay to prevent double toasts
        setTimeout(() => {
          addToast(cancelMessage, 'info');
        }, 100);
      }
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleCancel();
      }
    };

    // Add class to body when modal is open to prevent scrolling
    if (isOpen) {
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.classList.remove("modal-open");
    };
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine width based on size prop
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  }[size];

  // Modal type styling
  const typeClasses = {
    success: 'ring-emerald-500/30',
    warning: 'ring-yellow-500/30',
    danger: 'ring-red-500/30',
    info: 'ring-blue-500/30',
    confirm: 'ring-emerald-500/30',
    form: 'ring-blue-500/30',
    delete: 'ring-red-500/30',
  }[type];

  const typeIcon = {
    success: '✅',
    warning: '⚠️',
    danger: '❌',
    info: 'ℹ️',
    confirm: '✅',
    form: '',
    delete: '🗑️',
  }[type];

  // Button styling based on modal type
  const confirmButtonClass = type === 'delete' 
    ? "px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 hover:shadow-md"
    : "px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 hover:shadow-md";

  // Content to be rendered in the portal
  const modalContent = (
    <>
      {/* Blur overlay */}
      <div 
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] animate-backdrop-appear"
        onClick={handleCancel}
        aria-hidden="true"
      />
      
      {/* Centered modal container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Actual modal */}
        <div
          ref={modalRef}
          className={`
            ${sizeClasses} w-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl 
            ${typeClasses}
            animate-toast-drop ring-2 ring-opacity-30
            transform overflow-hidden relative`}
          onClick={e => e.stopPropagation()}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`modal-title-${modalId}`}
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 
              id={`modal-title-${modalId}`} 
              className="text-lg font-medium text-gray-900 dark:text-white flex items-center"
            >
              {typeIcon && <span className="mr-2">{typeIcon}</span>}
              {title}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Body */}
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-10rem)]">
            {message && <p className="text-gray-700 dark:text-gray-300 mb-4">{message}</p>}
            {children}
          </div>
          
          {/* Footer with enhanced buttons */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 hover:shadow-md"
              onClick={handleCancel}
            >
              {cancelText}
            </button>
            
            {/* Always show validation button for standard confirmation modals */}
            {(type === 'confirm' || type === 'form' || type === 'info' || type === 'success' || type === 'warning' || type === 'danger') && (
              <button
                type="button"
                className={confirmButtonClass}
                onClick={handleConfirm}
              >
                {confirmText}
              </button>
            )}
            
            {/* Delete button - always render for delete modals */}
            {type === 'delete' && (
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 hover:shadow-md"
                onClick={handleConfirm}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // Use ReactDOM.createPortal to render the modal directly to document.body
  return ReactDOM.createPortal(modalContent, document.body);
};

export default Modal;