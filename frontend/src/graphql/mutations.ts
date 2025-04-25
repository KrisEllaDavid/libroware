import { gql } from '@apollo/client';

// User Mutations
export const CREATE_USER = gql`
  mutation CreateUser($input: UserCreateInput!) {
    createUser(input: $input) {
      id
      email
      firstName
      lastName
      role
      profilePicture
      requiresPasswordChange
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UserUpdateInput!) {
    updateUser(id: $id, input: $input) {
      id
      email
      firstName
      lastName
      role
      profilePicture
      requiresPasswordChange
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      id
    }
  }
`;

export const FORCE_DELETE_USER = gql`
  mutation ForceDeleteUser($id: ID!) {
    forceDeleteUser(id: $id) {
      id
    }
  }
`;

// Add this mutation after the FORCE_DELETE_USER mutation
export const UPLOAD_PROFILE_PICTURE = gql`
  mutation UploadProfilePicture($userId: ID!, $imageData: String!) {
    uploadProfilePicture(userId: $userId, imageData: $imageData) {
      success
      message
      user {
        id
        email
        firstName
        lastName
        role
        profilePicture
      }
    }
  }
`;

// After UPLOAD_PROFILE_PICTURE mutation

export const UPLOAD_FILE = gql`
  mutation UploadFile($file: String!, $type: UploadType!, $id: ID!) {
    uploadFile(file: $file, type: $type, id: $id) {
      success
      message
      url
      user {
        id
        profilePicture
      }
      book {
        id
        coverImage
      }
    }
  }
`;

// Book Mutations
export const CREATE_BOOK = gql`
  mutation CreateBook($input: BookCreateInput!) {
    createBook(input: $input) {
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

export const UPDATE_BOOK = gql`
  mutation UpdateBook($id: ID!, $input: BookUpdateInput!) {
    updateBook(id: $id, input: $input) {
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

export const DELETE_BOOK = gql`
  mutation DeleteBook($id: ID!) {
    deleteBook(id: $id) {
      id
    }
  }
`;

// Author Mutations
export const CREATE_AUTHOR = gql`
  mutation CreateAuthor($input: AuthorCreateInput!) {
    createAuthor(input: $input) {
      id
      name
    }
  }
`;

export const UPDATE_AUTHOR = gql`
  mutation UpdateAuthor($id: ID!, $input: AuthorUpdateInput!) {
    updateAuthor(id: $id, input: $input) {
      id
      name
    }
  }
`;

export const DELETE_AUTHOR = gql`
  mutation DeleteAuthor($id: ID!) {
    deleteAuthor(id: $id) {
      id
    }
  }
`;

// Category Mutations
export const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CategoryCreateInput!) {
    createCategory(input: $input) {
      id
      name
      description
    }
  }
`;

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: ID!, $input: CategoryUpdateInput!) {
    updateCategory(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id) {
      id
    }
  }
`;

// Borrow Mutations
export const CREATE_BORROW = gql`
  mutation CreateBorrow($input: BorrowCreateInput!) {
    createBorrow(input: $input) {
      id
      user {
        id
        firstName
        lastName
      }
      book {
        id
        title
      }
      borrowedAt
      dueDate
      note
      status
    }
  }
`;

export const UPDATE_BORROW = gql`
  mutation UpdateBorrow($id: ID!, $input: BorrowUpdateInput!) {
    updateBorrow(id: $id, input: $input) {
      id
      status
      returnedAt
    }
  }
`;

export const RETURN_BOOK = gql`
  mutation ReturnBook($id: ID!) {
    returnBook(id: $id) {
      id
      status
      returnedAt
    }
  }
`;

// Auth Mutations
export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        firstName
        lastName
        role
        profilePicture
        requiresPasswordChange
      }
    }
  }
`; 