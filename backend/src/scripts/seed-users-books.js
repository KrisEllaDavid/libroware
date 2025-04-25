const { PrismaClient } = require("../../generated/prisma");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function seedUsersAndBooks() {
  try {
    console.log("Starting to seed users and books...");

    // Create users if they don't exist
    const testUsers = [
      {
        email: "admin@libroware.com",
        password: "admin123",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
      },
      {
        email: "librarian@libroware.com",
        password: "librarian123",
        firstName: "Librarian",
        lastName: "Staff",
        role: "LIBRARIAN",
      },
      {
        email: "user1@example.com",
        password: "user123",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
      },
      {
        email: "user2@example.com",
        password: "user123",
        firstName: "Jane",
        lastName: "Smith",
        role: "USER",
      },
      {
        email: "user3@example.com",
        password: "user123",
        firstName: "Robert",
        lastName: "Johnson",
        role: "USER",
      },
    ];

    for (const userData of testUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword,
          },
        });
        console.log(`Created user: ${userData.email}`);
      } else {
        console.log(`User already exists: ${userData.email}`);
      }
    }

    // Create authors
    const authors = [
      { name: "J.K. Rowling" },
      { name: "George R.R. Martin" },
      { name: "Stephen King" },
      { name: "Agatha Christie" },
      { name: "J.R.R. Tolkien" },
    ];

    const createdAuthors = [];

    for (const authorData of authors) {
      const existingAuthor = await prisma.author.findFirst({
        where: { name: authorData.name },
      });

      if (!existingAuthor) {
        const author = await prisma.author.create({
          data: authorData,
        });
        createdAuthors.push(author);
        console.log(`Created author: ${authorData.name}`);
      } else {
        createdAuthors.push(existingAuthor);
        console.log(`Author already exists: ${authorData.name}`);
      }
    }

    // Create categories
    const categories = [
      { name: "Fiction", description: "Fictional literature" },
      { name: "Fantasy", description: "Fantasy genre books" },
      { name: "Mystery", description: "Mystery and detective stories" },
      { name: "Sci-Fi", description: "Science fiction" },
      { name: "Non-Fiction", description: "Non-fictional works" },
    ];

    const createdCategories = [];

    for (const categoryData of categories) {
      const existingCategory = await prisma.category.findUnique({
        where: { name: categoryData.name },
      });

      if (!existingCategory) {
        const category = await prisma.category.create({
          data: categoryData,
        });
        createdCategories.push(category);
        console.log(`Created category: ${categoryData.name}`);
      } else {
        createdCategories.push(existingCategory);
        console.log(`Category already exists: ${categoryData.name}`);
      }
    }

    // Create books
    const books = [
      {
        title: "Harry Potter and the Philosopher's Stone",
        isbn: "9780747532743",
        description: "The first book in the Harry Potter series",
        publishedAt: new Date("1997-06-26"),
        pageCount: 223,
        quantity: 5,
        authorIds: [createdAuthors.find((a) => a.name === "J.K. Rowling").id],
        categoryIds: [
          createdCategories.find((c) => c.name === "Fiction").id,
          createdCategories.find((c) => c.name === "Fantasy").id,
        ],
      },
      {
        title: "A Game of Thrones",
        isbn: "9780553103540",
        description: "The first book in A Song of Ice and Fire series",
        publishedAt: new Date("1996-08-01"),
        pageCount: 694,
        quantity: 3,
        authorIds: [
          createdAuthors.find((a) => a.name === "George R.R. Martin").id,
        ],
        categoryIds: [
          createdCategories.find((c) => c.name === "Fiction").id,
          createdCategories.find((c) => c.name === "Fantasy").id,
        ],
      },
      {
        title: "The Shining",
        isbn: "9780385121675",
        description: "A horror novel by Stephen King",
        publishedAt: new Date("1977-01-28"),
        pageCount: 447,
        quantity: 4,
        authorIds: [createdAuthors.find((a) => a.name === "Stephen King").id],
        categoryIds: [
          createdCategories.find((c) => c.name === "Fiction").id,
          createdCategories.find((c) => c.name === "Mystery").id,
        ],
      },
      {
        title: "Murder on the Orient Express",
        isbn: "9780062073501",
        description: "A famous detective novel featuring Hercule Poirot",
        publishedAt: new Date("1934-01-01"),
        pageCount: 256,
        quantity: 6,
        authorIds: [
          createdAuthors.find((a) => a.name === "Agatha Christie").id,
        ],
        categoryIds: [
          createdCategories.find((c) => c.name === "Fiction").id,
          createdCategories.find((c) => c.name === "Mystery").id,
        ],
      },
      {
        title: "The Hobbit",
        isbn: "9780618260300",
        description: "The prelude to The Lord of the Rings",
        publishedAt: new Date("1937-09-21"),
        pageCount: 310,
        quantity: 7,
        authorIds: [createdAuthors.find((a) => a.name === "J.R.R. Tolkien").id],
        categoryIds: [
          createdCategories.find((c) => c.name === "Fiction").id,
          createdCategories.find((c) => c.name === "Fantasy").id,
        ],
      },
      {
        title: "The Lord of the Rings",
        isbn: "9780544003415",
        description: "An epic high-fantasy novel",
        publishedAt: new Date("1954-07-29"),
        pageCount: 1178,
        quantity: 4,
        authorIds: [createdAuthors.find((a) => a.name === "J.R.R. Tolkien").id],
        categoryIds: [
          createdCategories.find((c) => c.name === "Fiction").id,
          createdCategories.find((c) => c.name === "Fantasy").id,
        ],
      },
      {
        title: "And Then There Were None",
        isbn: "9780062073488",
        description:
          "One of the world's best-selling mystery novels of all time",
        publishedAt: new Date("1939-11-06"),
        pageCount: 272,
        quantity: 5,
        authorIds: [
          createdAuthors.find((a) => a.name === "Agatha Christie").id,
        ],
        categoryIds: [
          createdCategories.find((c) => c.name === "Fiction").id,
          createdCategories.find((c) => c.name === "Mystery").id,
        ],
      },
      {
        title: "The Green Mile",
        isbn: "9780671041786",
        description: "A serial novel by Stephen King",
        publishedAt: new Date("1996-08-29"),
        pageCount: 400,
        quantity: 3,
        authorIds: [createdAuthors.find((a) => a.name === "Stephen King").id],
        categoryIds: [
          createdCategories.find((c) => c.name === "Fiction").id,
          createdCategories.find((c) => c.name === "Fantasy").id,
        ],
      },
    ];

    for (const bookData of books) {
      const existingBook = await prisma.book.findUnique({
        where: { isbn: bookData.isbn },
      });

      if (!existingBook) {
        // Create the book with connections to authors and categories
        await prisma.book.create({
          data: {
            title: bookData.title,
            isbn: bookData.isbn,
            description: bookData.description,
            publishedAt: bookData.publishedAt,
            pageCount: bookData.pageCount,
            quantity: bookData.quantity,
            available: bookData.quantity, // Initially, all books are available
            authors: {
              connect: bookData.authorIds.map((id) => ({ id })),
            },
            categories: {
              connect: bookData.categoryIds.map((id) => ({ id })),
            },
          },
        });
        console.log(`Created book: ${bookData.title}`);
      } else {
        console.log(`Book already exists: ${bookData.title}`);
      }
    }

    console.log("Seeding users and books completed successfully!");
  } catch (error) {
    console.error("Error seeding users and books:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedUsersAndBooks()
  .then(() => {
    console.log("Seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error in seed script:", error);
    process.exit(1);
  });
