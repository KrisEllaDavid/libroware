import React from 'react';
import { useToast, ToastType } from '../../context/ToastContext';

const ToastNotification: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const getToastClasses = (type: ToastType): string => {
    const baseClasses = 'p-4 rounded-lg shadow-xl flex items-center justify-between text-white max-w-md w-full mx-auto transform';
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-500 bg-opacity-95 ring-2 ring-green-500/30`;
      case 'error':
        return `${baseClasses} bg-red-500 bg-opacity-95 ring-2 ring-red-500/30`;
      case 'warning':
        return `${baseClasses} bg-yellow-500 bg-opacity-95 ring-2 ring-yellow-500/30`;
      case 'info':
        return `${baseClasses} bg-blue-500 bg-opacity-95 ring-2 ring-blue-500/30`;
      default:
        return `${baseClasses} bg-gray-700 bg-opacity-95 ring-2 ring-gray-500/30`;
    }
  };

  const getToastIcon = (type: ToastType): JSX.Element => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
          </svg>
        );
      default:
        return <></>;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <>
      {/* Full viewport backdrop when toasts are visible */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 pointer-events-none transition-opacity duration-300 animate-backdrop-appear"
        aria-hidden="true"
      ></div>
      
      {/* Toasts container - positioned in the center top of the viewport */}
      <div className="fixed top-4 inset-x-0 z-50 flex flex-col items-center gap-3 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${getToastClasses(toast.type)} animate-toast-drop ring-opacity-30 shadow-2xl overflow-hidden relative`}
            role="alert"
          >
            <div className="flex items-center overflow-hidden">
              {getToastIcon(toast.type)}
              <span className="text-sm font-medium truncate">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 rounded-full flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default ToastNotification; 