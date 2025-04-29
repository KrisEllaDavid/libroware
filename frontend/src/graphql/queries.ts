import { gql } from '@apollo/client';

// User Queries
export const GET_USERS = gql`
  query GetUsers($skip: Int, $take: Int) {
    users(skip: $skip, take: $take) {
      id
      email
      firstName
      lastName
      role
      profilePicture
      requiresPasswordChange
      createdAt
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      email
      firstName
      lastName
      role
      profilePicture
      requiresPasswordChange
      createdAt
      borrowedBooks {
        id
        book {
          title
        }
        borrowedAt
        dueDate
        status
      }
    }
  }
`;

// Book Queries
export const GET_BOOKS = gql`
  query GetBooks($skip: Int, $take: Int, $searchTitle: String) {
    books(skip: $skip, take: $take, searchTitle: $searchTitle) {
      id
      title
      isbn
      description
      publishedAt
      coverImage
      pageCount
      quantity
      available
      authors {
        id
        name
      }
      categories {
        id
        name
      }
    }
  }
`;

export const GET_BOOK = gql`
  query GetBook($id: ID!) {
    book(id: $id) {
      id
      title
      isbn
      description
      publishedAt
      coverImage
      pageCount
      quantity
      available
      authors {
        id
        name
      }
      categories {
        id
        name
      }
      reviews {
        id
        rating
        comment
        userName
        createdAt
      }
    }
  }
`;

// Author Queries
export const GET_AUTHORS = gql`
  query GetAuthors($skip: Int, $take: Int, $searchName: String) {
    authors(skip: $skip, take: $take, searchName: $searchName) {
      id
      name
      createdAt
    }
  }
`;

export const GET_AUTHOR = gql`
  query GetAuthor($id: ID!) {
    author(id: $id) {
      id
      name
      books {
        id
        title
        coverImage
      }
    }
  }
`;

// Category Queries
export const GET_CATEGORIES = gql`
  query GetCategories($skip: Int, $take: Int) {
    categories(skip: $skip, take: $take) {
      id
      name
      description
    }
  }
`;

export const GET_CATEGORY = gql`
  query GetCategory($id: ID!) {
    category(id: $id) {
      id
      name
      description
      books {
        id
        title
        coverImage
      }
    }
  }
`;

// Borrow Queries
export const GET_BORROWS = gql`
  query GetBorrows($skip: Int, $take: Int, $status: BorrowStatus) {
    borrows(skip: $skip, take: $take, status: $status) {
      id
      user {
        id
        firstName
        lastName
        email
      }
      book {
        id
        title
        isbn
        authors {
          id
          name
        }
        coverImage
      }
      borrowedAt
      dueDate
      returnedAt
      status
    }
  }
`;

export const USER_BORROWS = gql`
  query UserBorrows($userId: ID!) {
    userBorrows(userId: $userId) {
      id
      book {
        id
        title
        isbn
        authors {
          id
          name
        }
        categories {
          id
          name
        }
        coverImage
      }
      borrowedAt
      dueDate
      returnedAt
      status
    }
  }
`;

export const GET_OVERDUE_BORROWS = gql`
  query GetOverdueBorrows {
    overdueBorrows {
      id
      user {
        id
        firstName
        lastName
        email
      }
      book {
        id
        title
      }
      borrowedAt
      dueDate
      status
    }
  }
`; 