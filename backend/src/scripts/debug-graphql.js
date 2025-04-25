const { PrismaClient } = require("../../generated/prisma");
const prisma = new PrismaClient();

async function debugBorrows() {
  try {
    console.log("Starting GraphQL debug...");

    // 1. Count all borrows
    console.log("Counting borrows...");
    const borrowCount = await prisma.borrow.count();
    console.log(`Total borrows in database: ${borrowCount}`);

    // 2. Count borrows with BORROWED status
    console.log("Counting BORROWED status...");
    const borrowedCount = await prisma.borrow.count({
      where: { status: "BORROWED" },
    });
    console.log(`Borrows with BORROWED status: ${borrowedCount}`);

    // 3. Count borrows with RETURNED status
    console.log("Counting RETURNED status...");
    const returnedCount = await prisma.borrow.count({
      where: { status: "RETURNED" },
    });
    console.log(`Borrows with RETURNED status: ${returnedCount}`);

    // 4. Count borrows with OVERDUE status
    console.log("Counting OVERDUE status...");
    const overdueCount = await prisma.borrow.count({
      where: { status: "OVERDUE" },
    });
    console.log(`Borrows with OVERDUE status: ${overdueCount}`);

    // 5. Get all borrows with full details
    console.log("\nFetching sample borrows with details...");
    const borrows = await prisma.borrow.findMany({
      take: 2, // Reduce to 2 to minimize output
      include: {
        user: true,
        book: true,
      },
      orderBy: {
        borrowedAt: "desc",
      },
    });

    if (borrows.length > 0) {
      console.log(`\nFound ${borrows.length} sample borrows:`);
      borrows.forEach((borrow, index) => {
        console.log(`\n--- Borrow ${index + 1} ---`);
        console.log(`ID: ${borrow.id}`);
        console.log(`Status: ${borrow.status}`);
        console.log(
          `Borrowed At: ${new Date(borrow.borrowedAt).toISOString()}`
        );
        console.log(`Due Date: ${new Date(borrow.dueDate).toISOString()}`);
        console.log(
          `Returned At: ${
            borrow.returnedAt
              ? new Date(borrow.returnedAt).toISOString()
              : "Not returned"
          }`
        );
        console.log(
          `User: ${borrow.user?.firstName || "Unknown"} ${
            borrow.user?.lastName || ""
          } (${borrow.user?.email || "No email"})`
        );
        console.log(
          `Book: ${borrow.book?.title || "Unknown"} (ISBN: ${
            borrow.book?.isbn || "No ISBN"
          })`
        );
      });
    } else {
      console.log("No borrow records found in the database.");
    }

    // 6. Check for any issues with borrows
    console.log("\nChecking for potential data issues...");

    // Check for orphaned borrows with invalid references
    console.log("Checking for orphaned borrows...");
    const orphanedBorrows = await prisma.borrow.findMany({
      where: {
        OR: [
          {
            userId: {
              equals: "",
            },
          },
          {
            bookId: {
              equals: "",
            },
          },
        ],
      },
    });
    console.log(
      `Borrows with potential missing references: ${orphanedBorrows.length}`
    );

    // Check for invalid statuses
    console.log("Checking for invalid statuses...");
    const invalidStatusBorrows = await prisma.borrow.findMany({
      where: {
        status: {
          notIn: ["BORROWED", "RETURNED", "OVERDUE"],
        },
      },
    });
    console.log(`Borrows with invalid status: ${invalidStatusBorrows.length}`);

    console.log("\nGraphQL debug completed");
  } catch (error) {
    console.error("Error during GraphQL debug:", error);
  } finally {
    console.log("Disconnecting from database...");
    await prisma.$disconnect();
    console.log("Disconnected.");
  }
}

// Run the debug function
console.log("Starting debug script...");
debugBorrows()
  .then(() => {
    console.log("Debug script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error in debug script:", error);
    process.exit(1);
  });
