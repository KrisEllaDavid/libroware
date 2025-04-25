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
} 