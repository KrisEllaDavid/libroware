# Libroware Frontend

## Overview

This is the frontend application for the Libroware library management system. It provides a user interface for managing books, authors, categories, users, and borrows.

## Features

- Modern React UI with TypeScript
- Apollo Client for GraphQL API integration
- Complete CRUD operations for all entities
- Responsive design with Tailwind CSS

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Project Structure

```
frontend/
├── public/               # Static assets
├── src/
│   ├── components/       # React components
│   │   ├── admin/        # Admin panel components
│   │   └── dashboard/    # Dashboard components
│   ├── context/          # React context providers
│   ├── graphql/          # GraphQL queries and mutations
│   ├── pages/            # Page components
│   ├── assets/           # Images and other assets
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── tailwind.config.js    # Tailwind CSS configuration
└── package.json          # Project dependencies and scripts
```

## Admin Panel

The Admin Panel provides interfaces for managing:

- Users (create, edit, delete)
- Books (create, edit, delete, with author and category associations)
- Authors (create, edit, delete)
- Categories (create, edit, delete)

## Usage

1. Ensure the backend server is running
2. Open http://localhost:3000 in your browser
3. Login with admin credentials
4. Create users, books, authors, and categories through the Admin Panel

## Development

- React 18 with TypeScript
- Apollo Client for GraphQL API
- Tailwind CSS for styling
- Vite for fast development and building
