const { PrismaClient } = require("../../generated/prisma");
const prisma = new PrismaClient();

// Helper to generate random dates within a range
function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

// Generate a random integer between min and max (inclusive)
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedBorrows() {
  try {
    console.log("Starting to seed borrow records...");

    // Get all users (excluding admins)
    const users = await prisma.user.findMany({
      where: {
        role: { not: "ADMIN" },
      },
    });

    if (users.length === 0) {
      console.log("No users found. Please create some users first.");
      return;
    }

    // Get all books
    const books = await prisma.book.findMany();

    if (books.length === 0) {
      console.log("No books found. Please create some books first.");
      return;
    }

    console.log(
      `Found ${users.length} users and ${books.length} books for creating borrows.`
    );

    // Create active and returned borrows for each user
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);

    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(now.getMonth() - 2);

    const borrowRecords = [];

    // Create some BORROWED books
    for (let i = 0; i < Math.min(books.length, 10); i++) {
      const randomUser = users[randomInt(0, users.length - 1)];
      const randomBook = books[randomInt(0, books.length - 1)];

      const borrowedAt = randomDate(oneMonthAgo, now);
      const dueDate = new Date(borrowedAt);
      dueDate.setDate(dueDate.getDate() + 14); // 2 weeks loan period

      borrowRecords.push({
        userId: randomUser.id,
        bookId: randomBook.id,
        borrowedAt,
        dueDate,
        status: "BORROWED",
      });
    }

    // Create some RETURNED books
    for (let i = 0; i < Math.min(books.length, 8); i++) {
      const randomUser = users[randomInt(0, users.length - 1)];
      const randomBook = books[randomInt(0, books.length - 1)];

      const borrowedAt = randomDate(twoMonthsAgo, oneMonthAgo);
      const dueDate = new Date(borrowedAt);
      dueDate.setDate(dueDate.getDate() + 14); // 2 weeks loan period

      const returnedAt = randomDate(borrowedAt, dueDate);

      borrowRecords.push({
        userId: randomUser.id,
        bookId: randomBook.id,
        borrowedAt,
        dueDate,
        returnedAt,
        status: "RETURNED",
      });
    }

    // Create some OVERDUE books
    for (let i = 0; i < Math.min(books.length, 5); i++) {
      const randomUser = users[randomInt(0, users.length - 1)];
      const randomBook = books[randomInt(0, books.length - 1)];

      const borrowedAt = randomDate(twoMonthsAgo, oneMonthAgo);
      const dueDate = new Date(borrowedAt);
      dueDate.setDate(dueDate.getDate() + 7); // 1 week loan period (to ensure it's overdue)

      borrowRecords.push({
        userId: randomUser.id,
        bookId: randomBook.id,
        borrowedAt,
        dueDate,
        status: "OVERDUE",
      });
    }

    // Insert all borrow records
    console.log(`Creating ${borrowRecords.length} borrow records...`);

    // Create each borrow record
    for (const borrowRecord of borrowRecords) {
      await prisma.borrow.create({
        data: borrowRecord,
      });
    }

    console.log("Borrow records created successfully!");
  } catch (error) {
    console.error("Error seeding borrows:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedBorrows()
  .then(() => {
    console.log("Seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error in seed script:", error);
    process.exit(1);
  });
