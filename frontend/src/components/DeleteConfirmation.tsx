import React, { ReactNode } from 'react';
import Modal from './Modal';

interface DeleteConfirmationProps {
  isOpen: boolean;
  title?: string;
  message?: ReactNode;
  itemType?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isDanger?: boolean;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  isOpen,
  title = 'Confirm Delete',
  message,
  itemType = 'item',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  isDanger = false,
}) => {
  const defaultMessage = `Are you sure you want to delete this ${itemType}? This cannot be undone.`;

  return (
    <Modal 
      isOpen={isOpen}
      title={title}
      message={message || defaultMessage}
      confirmText={isLoading ? 'Deleting...' : confirmText}
      cancelText={cancelText}
      onConfirm={onConfirm}
      onCancel={onCancel}
      type={isDanger ? "danger" : "delete"}
    />
  );
};

export default DeleteConfirmation; 