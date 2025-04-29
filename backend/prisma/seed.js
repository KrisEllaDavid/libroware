const { PrismaClient } = require("../generated/prisma");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting to seed the database...");

  // Clean up existing data
  await prisma.review.deleteMany({});
  await prisma.borrow.deleteMany({});
  await prisma.book.deleteMany({});
  await prisma.author.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Database cleaned up.");

  // Create users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@libroware.com",
      password: adminPassword,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    },
  });

  const librarian = await prisma.user.create({
    data: {
      email: "librarian@libroware.com",
      password: userPassword,
      firstName: "Library",
      lastName: "Staff",
      role: "LIBRARIAN",
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: "john@example.com",
      password: userPassword,
      firstName: "John",
      lastName: "Doe",
      role: "USER",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "jane@example.com",
      password: userPassword,
      firstName: "Jane",
      lastName: "Smith",
      role: "USER",
    },
  });

  console.log("Users created:", { admin, librarian, user1, user2 });

  // Create categories
  const fictionCategory = await prisma.category.create({
    data: {
      name: "Fiction",
      description: "Fictional literature",
    },
  });

  const scienceCategory = await prisma.category.create({
    data: {
      name: "Science",
      description: "Scientific books and papers",
    },
  });

  const historyCategory = await prisma.category.create({
    data: {
      name: "History",
      description: "Historical accounts and analysis",
    },
  });

  const computerCategory = await prisma.category.create({
    data: {
      name: "Computer Science",
      description: "Programming and technology books",
    },
  });

  console.log("Categories created");

  // Create authors
  const author1 = await prisma.author.create({
    data: {
      name: "J.K. Rowling",
    },
  });

  const author2 = await prisma.author.create({
    data: {
      name: "George Orwell",
    },
  });

  const author3 = await prisma.author.create({
    data: {
      name: "Stephen Hawking",
    },
  });

  const author4 = await prisma.author.create({
    data: {
      name: "Robert C. Martin",
    },
  });

  console.log("Authors created");

  // Create books
  const book1 = await prisma.book.create({
    data: {
      title: "Harry Potter and the Philosopher's Stone",
      isbn: "9780747532743",
      description: "The first book in the Harry Potter series",
      publishedAt: new Date("1997-06-26"),
      pageCount: 223,
      quantity: 5,
      available: 3,
      coverImage: "https://covers.openlibrary.org/b/id/8267078-L.jpg",
      authors: {
        connect: { id: author1.id },
      },
      categories: {
        connect: { id: fictionCategory.id },
      },
    },
  });

  const book2 = await prisma.book.create({
    data: {
      title: "1984",
      isbn: "9780451524935",
      description: "A dystopian novel by George Orwell",
      publishedAt: new Date("1949-06-08"),
      pageCount: 328,
      quantity: 10,
      available: 8,
      coverImage: "https://covers.openlibrary.org/b/id/8575708-L.jpg",
      authors: {
        connect: { id: author2.id },
      },
      categories: {
        connect: [{ id: fictionCategory.id }, { id: historyCategory.id }],
      },
    },
  });

  const book3 = await prisma.book.create({
    data: {
      title: "A Brief History of Time",
      isbn: "9780553380163",
      description: "A book about cosmology by Stephen Hawking",
      publishedAt: new Date("1988-03-01"),
      pageCount: 212,
      quantity: 3,
      available: 3,
      coverImage: "https://covers.openlibrary.org/b/id/8110075-L.jpg",
      authors: {
        connect: { id: author3.id },
      },
      categories: {
        connect: { id: scienceCategory.id },
      },
    },
  });

  const book4 = await prisma.book.create({
    data: {
      title: "Clean Code: A Handbook of Agile Software Craftsmanship",
      isbn: "9780132350884",
      description: "A book about writing clean code by Robert C. Martin",
      publishedAt: new Date("2008-08-01"),
      pageCount: 464,
      quantity: 2,
      available: 1,
      coverImage: "https://covers.openlibrary.org/b/id/8935150-L.jpg",
      authors: {
        connect: { id: author4.id },
      },
      categories: {
        connect: { id: computerCategory.id },
      },
    },
  });

  console.log("Books created");

  // Create borrows
  const borrow1 = await prisma.borrow.create({
    data: {
      userId: user1.id,
      bookId: book1.id,
      borrowedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days in the future
      status: "BORROWED",
    },
  });

  const borrow2 = await prisma.borrow.create({
    data: {
      userId: user2.id,
      bookId: book2.id,
      borrowedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (overdue)
      status: "BORROWED",
    },
  });

  const borrow3 = await prisma.borrow.create({
    data: {
      userId: user1.id,
      bookId: book4.id,
      borrowedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      returnedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
      status: "RETURNED",
    },
  });

  // Add more borrow records for testing
  const borrow4 = await prisma.borrow.create({
    data: {
      userId: user2.id,
      bookId: book3.id,
      borrowedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      dueDate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), // 31 days ago
      returnedAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000), // 32 days ago (returned on time)
      status: "RETURNED",
    },
  });

  const borrow5 = await prisma.borrow.create({
    data: {
      userId: librarian.id,
      bookId: book1.id,
      borrowedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago (overdue)
      status: "BORROWED", // Will be marked as overdue by resolver
    },
  });

  const borrow6 = await prisma.borrow.create({
    data: {
      userId: user1.id,
      bookId: book2.id,
      borrowedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      dueDate: new Date(Date.now() - 46 * 24 * 60 * 60 * 1000), // 46 days ago
      returnedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago (returned on time)
      status: "RETURNED",
    },
  });

  const borrow7 = await prisma.borrow.create({
    data: {
      userId: admin.id,
      bookId: book3.id,
      borrowedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      dueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days in the future
      status: "BORROWED",
    },
  });

  console.log("Borrows created");

  // Create reviews
  const review1 = await prisma.review.create({
    data: {
      bookId: book1.id,
      userEmail: user1.email,
      userName: `${user1.firstName} ${user1.lastName}`,
      rating: 5,
      comment: "Amazing book! I loved the story and characters.",
    },
  });

  const review2 = await prisma.review.create({
    data: {
      bookId: book2.id,
      userEmail: user2.email,
      userName: `${user2.firstName} ${user2.lastName}`,
      rating: 4,
      comment:
        "A profound and thought-provoking novel that remains relevant today.",
    },
  });

  const review3 = await prisma.review.create({
    data: {
      bookId: book3.id,
      userEmail: user1.email,
      userName: `${user1.firstName} ${user1.lastName}`,
      rating: 5,
      comment: "Explains complex scientific concepts in an accessible way.",
    },
  });

  const review4 = await prisma.review.create({
    data: {
      bookId: book4.id,
      userEmail: librarian.email,
      userName: `${librarian.firstName} ${librarian.lastName}`,
      rating: 5,
      comment: "Essential reading for any software developer.",
    },
  });

  console.log("Reviews created");
  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
