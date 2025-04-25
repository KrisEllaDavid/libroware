# Libroware Backend

## Overview

This is the backend service for the Libroware library management system. It provides GraphQL API endpoints for managing users, books, authors, categories, borrows, and reviews.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
# Create a .env file with the following:
DATABASE_URL="postgresql://username:password@localhost:5432/libroware"
JWT_SECRET="your-secret-key"
PORT=4000
```

3. Run database migrations:

```bash
npx prisma migrate dev
```

4. Create an admin user:

```bash
npm run create-admin
```

5. Start the server:

```bash
npm start
```

## Database Seeding (Optional)

You can either:

1. Use the seed script to populate the database with test data:

```bash
npm run seed
```

2. Or use the frontend Admin Panel UI to create data through the GraphQL API.
   - The Admin Panel provides complete CRUD functionality for all entities
   - This is the recommended approach for ongoing data management

Note: The seed script is only needed for initial setup or testing. For normal operation, the frontend admin panel should be used to manage data.

## Project Structure

```
backend/
├── prisma/                 # Database schema and migrations
│   ├── migrations/         # Database migrations
│   ├── schema.prisma       # Prisma schema definition
│   └── seed.js             # Database seed script
├── src/
│   ├── graphql/            # GraphQL API
│   │   ├── resolvers/      # Query and mutation resolvers
│   │   └── schema.graphql  # GraphQL schema
│   ├── scripts/            # Utility scripts
│   │   └── create-admin.js # Admin user creation script
│   └── index.js            # Application entry point
├── package.json            # Project dependencies and scripts
└── .env                    # Environment variables (not checked into git)
```

## Utility Scripts

### Create Admin User

Create an admin user with default or custom credentials:

```bash
# Create default admin (admin@libroware.com / Admin123!)
npm run create-admin

# Create custom admin
node src/scripts/create-admin.js email=custom@example.com password=SecurePass123
```

## Features

- GraphQL API with Apollo Server
- JWT authentication
- User roles (ADMIN, LIBRARIAN, USER)
- Book management
- Author management
- Category management
- Borrowing system
- Review system
