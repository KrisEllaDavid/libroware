import { gql } from '@apollo/client';

// Deleted records queries
export const GET_DELETED_USERS = gql`
  query GetDeletedUsers($skip: Int, $take: Int) {
    deletedUsers(skip: $skip, take: $take) {
      id email firstName lastName role deletedAt createdAt
    }
  }
`;

export const GET_DELETED_BOOKS = gql`
  query GetDeletedBooks($skip: Int, $take: Int) {
    deletedBooks(skip: $skip, take: $take) {
      id title isbn deletedAt createdAt
      authors { name }
      categories { name }
    }
  }
`;

// Analytics Queries
export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      totalBooks availableBooks borrowedBooks overdueBooks
      totalUsers activeUsers
      totalBorrows borrowsThisMonth
      totalReservations
      outstandingFines collectedFines waivedFines
    }
  }
`;

export const GET_BORROW_TRENDS = gql`
  query GetBorrowTrends($months: Int) {
    borrowTrends(months: $months) { month borrows returns }
  }
`;

export const GET_TOP_BORROWED_BOOKS = gql`
  query GetTopBorrowedBooks($take: Int) {
    topBorrowedBooks(take: $take) { bookId title count }
  }
`;

export const GET_CATEGORY_BORROW_STATS = gql`
  query GetCategoryBorrowStats {
    categoryBorrowStats { category count }
  }
`;

// Fine Queries
export const GET_USER_FINES = gql`
  query GetUserFines($userId: ID!, $skip: Int, $take: Int) {
    userFines(userId: $userId, skip: $skip, take: $take) {
      id borrowId userId amount dailyRate daysOverdue waived waivedAt paidAt createdAt
      borrow { id dueDate returnedAt book { id title } }
    }
  }
`;

export const GET_ALL_FINES = gql`
  query GetAllFines($skip: Int, $take: Int, $waived: Boolean) {
    allFines(skip: $skip, take: $take, waived: $waived) {
      id borrowId userId amount dailyRate daysOverdue waived waivedAt paidAt createdAt
      borrow { id dueDate returnedAt user { id firstName lastName email } book { id title } }
    }
  }
`;

// Reservation Queries
export const GET_USER_RESERVATIONS = gql`
  query GetUserReservations($userId: ID!, $skip: Int, $take: Int) {
    userReservations(userId: $userId, skip: $skip, take: $take) {
      id status expiresAt createdAt
      book { id title coverImage authors { name } available }
    }
  }
`;

export const GET_BOOK_RESERVATIONS = gql`
  query GetBookReservations($bookId: ID!, $skip: Int, $take: Int) {
    bookReservations(bookId: $bookId, skip: $skip, take: $take) {
      id status expiresAt createdAt
      user { id firstName lastName email }
    }
  }
`;

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
