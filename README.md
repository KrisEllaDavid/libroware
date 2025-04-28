# LibroWare - Library Management System

LibroWare is a modern library management system built with React, TypeScript, Node.js, Apollo GraphQL, and PostgreSQL. It allows libraries to manage books, users, borrowing, and more through an intuitive interface.

## Project Structure

The project is organized as a monorepo with two main directories:

- `frontend/`: React application built with Vite, TypeScript, and Apollo Client
- `backend/`: Node.js API server with Express, Apollo Server, and Prisma ORM

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Setup Instructions

#### Clone the repository

```bash
git clone https://github.com/your-username/libroware.git
cd libroware
```

#### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your database credentials and other settings.

4. Set up the database:

   ```bash
   npx prisma migrate dev
   ```

5. Seed the database (optional):

   ```bash
   npm run seed
   ```

6. Start the backend server:
   ```bash
   npm start
   ```
   The server will be available at http://localhost:4000/graphql.

#### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at http://localhost:3000.

## Features

- **User Management**: Register, login, and manage user profiles
- **Book Management**: Add, edit, delete, and search books
- **Borrowing System**: Check out books, return them, track borrowing history
- **Categorization**: Organize books by categories and authors
- **Statistics**: View library statistics and user activity
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

### Frontend

- React with TypeScript
- Vite for fast development and building
- Apollo Client for GraphQL data fetching
- TailwindCSS for styling
- React Router for navigation

### Backend

- Node.js with Express
- Apollo Server for GraphQL API
- Prisma ORM for database access
- PostgreSQL for data storage
- JWT for authentication

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## NB: Make sure you do this before running

1. Go to or create frontend/.env
2. Insert VITE_API_URL=http://{your_own_host_ip}:4000/graphql
3. Then move to or create backend/.env and put:

   DATABASE_URL="your_postgresql_db_link_here"

   PORT=4000
   NODE_ENV=development

   JWT_SECRET="your-secret-key-here"

   CLOUDINARY_CLOUD_NAME="name_here"
   CLOUDINARY_API_KEY="key_here"
   CLOUDINARY_API_SECRET="secret_here"

   Hurraaaayyyy !! Everything shoul be working fine !
