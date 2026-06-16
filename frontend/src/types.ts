export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface Author {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Book {
  id: string;
  title: string;
  isbn: string;
  description: string | null;
  publishedAt: string;
  coverImage: string | null;
  pageCount: number;
  quantity: number;
  available: number;
  authors: Author[];
  categories: Category[];
}

export type Role = 'USER' | 'LIBRARIAN' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  profilePicture?: string;
  createdAt: string;
  requiresPasswordChange?: boolean;
  activeBorrowCount?: number;
  overdueBorrowCount?: number;
  outstandingFines?: number;
}

export type NotificationType =
  | 'BORROW_REQUEST'
  | 'BORROW_APPROVED'
  | 'BORROW_REJECTED'
  | 'OVERDUE_REMINDER'
  | 'RESERVATION_READY'
  | 'FINE_ISSUED';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}