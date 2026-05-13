const { PrismaClient } = require("../generated/prisma");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();

function generatePassword() {
  return crypto.randomBytes(16).toString("base64url");
}

async function main() {
  console.log("Starting database seed...");

  await prisma.review.deleteMany({});
  await prisma.borrow.deleteMany({});
  await prisma.book.deleteMany({});
  await prisma.author.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // Generate one-time passwords — printed to console, must be changed on first login
  const adminPw     = generatePassword();
  const librarianPw = generatePassword();
  const userPw      = generatePassword();

  const admin = await prisma.user.create({
    data: {
      email: "admin@libroware.com",
      password: await bcrypt.hash(adminPw, 10),
      firstName: "Admin", lastName: "User",
      role: "ADMIN", requiresPasswordChange: true,
    },
  });

  const librarian = await prisma.user.create({
    data: {
      email: "librarian@libroware.com",
      password: await bcrypt.hash(librarianPw, 10),
      firstName: "Library", lastName: "Staff",
      role: "LIBRARIAN", requiresPasswordChange: true,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: "john@example.com",
      password: await bcrypt.hash(userPw, 10),
      firstName: "John", lastName: "Doe",
      role: "USER", requiresPasswordChange: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "jane@example.com",
      password: await bcrypt.hash(userPw, 10),
      firstName: "Jane", lastName: "Smith",
      role: "USER", requiresPasswordChange: true,
    },
  });

  console.log("\n=== SEED CREDENTIALS (change on first login) ===");
  console.log(`admin@libroware.com      : ${adminPw}`);
  console.log(`librarian@libroware.com  : ${librarianPw}`);
  console.log(`john@example.com         : ${userPw}`);
  console.log(`jane@example.com         : ${userPw}`);
  console.log("================================================\n");

  const [fiction, science, history, cs] = await Promise.all([
    prisma.category.create({ data: { name: "Fiction",          description: "Fictional literature" } }),
    prisma.category.create({ data: { name: "Science",          description: "Scientific books and papers" } }),
    prisma.category.create({ data: { name: "History",          description: "Historical accounts and analysis" } }),
    prisma.category.create({ data: { name: "Computer Science", description: "Programming and technology books" } }),
  ]);

  const [a1, a2, a3, a4] = await Promise.all([
    prisma.author.create({ data: { name: "J.K. Rowling" } }),
    prisma.author.create({ data: { name: "George Orwell" } }),
    prisma.author.create({ data: { name: "Stephen Hawking" } }),
    prisma.author.create({ data: { name: "Robert C. Martin" } }),
  ]);

  const [b1, b2, b3, b4] = await Promise.all([
    prisma.book.create({ data: { title: "Harry Potter and the Philosopher's Stone", isbn: "9780747532743",
      description: "The first book in the Harry Potter series", publishedAt: new Date("1997-06-26"),
      pageCount: 223, quantity: 5, available: 3,
      coverImage: "https://covers.openlibrary.org/b/id/8267078-L.jpg",
      authors: { connect: { id: a1.id } }, categories: { connect: { id: fiction.id } } } }),
    prisma.book.create({ data: { title: "1984", isbn: "9780451524935",
      description: "A dystopian novel by George Orwell", publishedAt: new Date("1949-06-08"),
      pageCount: 328, quantity: 10, available: 8,
      coverImage: "https://covers.openlibrary.org/b/id/8575708-L.jpg",
      authors: { connect: { id: a2.id } }, categories: { connect: [{ id: fiction.id }, { id: history.id }] } } }),
    prisma.book.create({ data: { title: "A Brief History of Time", isbn: "9780553380163",
      description: "A book about cosmology by Stephen Hawking", publishedAt: new Date("1988-03-01"),
      pageCount: 212, quantity: 3, available: 3,
      coverImage: "https://covers.openlibrary.org/b/id/8110075-L.jpg",
      authors: { connect: { id: a3.id } }, categories: { connect: { id: science.id } } } }),
    prisma.book.create({ data: { title: "Clean Code", isbn: "9780132350884",
      description: "A handbook of agile software craftsmanship", publishedAt: new Date("2008-08-01"),
      pageCount: 464, quantity: 2, available: 1,
      coverImage: "https://covers.openlibrary.org/b/id/8935150-L.jpg",
      authors: { connect: { id: a4.id } }, categories: { connect: { id: cs.id } } } }),
  ]);

  const now = Date.now();
  const days = (n) => new Date(now + n * 86400000);

  await Promise.all([
    prisma.borrow.create({ data: { userId: user1.id, bookId: b1.id, borrowedAt: days(-10), dueDate: days(4),  status: "BORROWED" } }),
    prisma.borrow.create({ data: { userId: user2.id, bookId: b2.id, borrowedAt: days(-15), dueDate: days(-1), status: "BORROWED" } }),
    prisma.borrow.create({ data: { userId: user1.id, bookId: b4.id, borrowedAt: days(-30), dueDate: days(-10), returnedAt: days(-12), status: "RETURNED" } }),
    prisma.borrow.create({ data: { userId: user2.id, bookId: b3.id, borrowedAt: days(-45), dueDate: days(-31), returnedAt: days(-32), status: "RETURNED" } }),
    prisma.borrow.create({ data: { userId: admin.id, bookId: b3.id, borrowedAt: days(-5),  dueDate: days(9),   status: "BORROWED" } }),
  ]);

  await Promise.all([
    prisma.review.create({ data: { bookId: b1.id, userId: user1.id, userEmail: user1.email, userName: "John Doe",     rating: 5, comment: "Amazing book!" } }),
    prisma.review.create({ data: { bookId: b2.id, userId: user2.id, userEmail: user2.email, userName: "Jane Smith",   rating: 4, comment: "Thought-provoking and relevant." } }),
    prisma.review.create({ data: { bookId: b3.id, userId: user1.id, userEmail: user1.email, userName: "John Doe",     rating: 5, comment: "Complex concepts explained simply." } }),
    prisma.review.create({ data: { bookId: b4.id, userId: librarian.id, userEmail: librarian.email, userName: "Library Staff", rating: 5, comment: "Essential for every developer." } }),
  ]);

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
