const { PrismaClient } = require("../../../generated/prisma");
const prisma = new PrismaClient();

// Helper function to check and update overdue borrows
const checkAndUpdateOverdueStatus = async (borrows) => {
  const now = new Date();
  const updatedBorrows = [];

  for (const borrow of borrows) {
    // Skip returned borrows
    if (borrow.status === "RETURNED") {
      updatedBorrows.push(borrow);
      continue;
    }

    // Check if borrow is overdue
    const dueDate = new Date(borrow.dueDate);
    if (dueDate < now && borrow.status !== "OVERDUE") {
      // Update status in database
      const updated = await prisma.borrow.update({
        where: { id: borrow.id },
        data: { status: "OVERDUE" },
      });
      updatedBorrows.push(updated);
    } else {
      updatedBorrows.push(borrow);
    }
  }

  return updatedBorrows;
};

module.exports = {
  Query: {
    borrow: async (_, { id }) => {
      const borrow = await prisma.borrow.findUnique({ where: { id } });

      // Check if borrow is overdue
      if (borrow && borrow.status === "BORROWED") {
        const now = new Date();
        const dueDate = new Date(borrow.dueDate);

        if (dueDate < now) {
          // Update status in database
          return prisma.borrow.update({
            where: { id: borrow.id },
            data: { status: "OVERDUE" },
          });
        }
      }

      return borrow;
    },

    borrows: async (_, { skip = 0, take = 10, status }) => {
      const where = status ? { status } : {};

      const borrows = await prisma.borrow.findMany({
        where,
        skip,
        take,
        orderBy: { borrowedAt: "desc" },
      });

      // Check and update overdue status for all non-returned borrows
      return checkAndUpdateOverdueStatus(borrows);
    },

    userBorrows: async (_, { userId, status }) => {
      const where = {
        userId,
        ...(status && { status }),
      };

      const borrows = await prisma.borrow.findMany({
        where,
        orderBy: { borrowedAt: "desc" },
      });

      // Check and update overdue status for all non-returned borrows
      return checkAndUpdateOverdueStatus(borrows);
    },

    overdueBorrows: async () => {
      const now = new Date();

      // Find all potential overdue borrows (includes already marked ones)
      const borrows = await prisma.borrow.findMany({
        where: {
          status: { in: ["BORROWED", "OVERDUE"] },
          dueDate: {
            lt: now,
          },
        },
        orderBy: { dueDate: "asc" },
      });

      // Update those that are not already marked as overdue
      const updates = borrows
        .filter((borrow) => borrow.status !== "OVERDUE")
        .map((borrow) =>
          prisma.borrow.update({
            where: { id: borrow.id },
            data: { status: "OVERDUE" },
          })
        );

      if (updates.length > 0) {
        await Promise.all(updates);
      }

      // Fetch the updated borrows
      return prisma.borrow.findMany({
        where: {
          status: "OVERDUE",
        },
        orderBy: { dueDate: "asc" },
      });
    },
  },

  Mutation: {
    createBorrow: async (_, { input }) => {
      const { userId, bookId, dueDate, note } = input;

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error("User not found");
      }

      // Check if book exists
      const book = await prisma.book.findUnique({ where: { id: bookId } });
      if (!book) {
        throw new Error("Book not found");
      }

      // Check if book is available
      if (book.available <= 0) {
        throw new Error("Book is not available for borrowing");
      }

      // Create transaction to update book availability and create borrow record
      return prisma.$transaction(async (tx) => {
        // Decrement available count
        await tx.book.update({
          where: { id: bookId },
          data: { available: { decrement: 1 } },
        });

        // Create borrow record
        return tx.borrow.create({
          data: {
            user: { connect: { id: userId } },
            book: { connect: { id: bookId } },
            dueDate: new Date(dueDate),
            status: "BORROWED",
            ...(note && { note }),
          },
          include: {
            user: true,
            book: true,
          },
        });
      });
    },

    updateBorrow: async (_, { id, input }) => {
      // Check if borrow record exists
      const borrow = await prisma.borrow.findUnique({ where: { id } });
      if (!borrow) {
        throw new Error("Borrow record not found");
      }

      // Update borrow record
      return prisma.borrow.update({
        where: { id },
        data: input,
        include: {
          user: true,
          book: true,
        },
      });
    },

    returnBook: async (_, { id }) => {
      // Check if borrow record exists
      const borrow = await prisma.borrow.findUnique({
        where: { id },
        include: { book: true },
      });

      if (!borrow) {
        throw new Error("Borrow record not found");
      }

      // Check if book is already returned
      if (borrow.status === "RETURNED") {
        throw new Error("Book is already returned");
      }

      // Update transaction to increment book availability and update borrow status
      return prisma.$transaction(async (tx) => {
        // Increment available count
        await tx.book.update({
          where: { id: borrow.book.id },
          data: { available: { increment: 1 } },
        });

        // Set status to RETURNED and update returnedAt
        return tx.borrow.update({
          where: { id },
          data: {
            status: "RETURNED",
            returnedAt: new Date(),
          },
          include: {
            user: true,
            book: true,
          },
        });
      });
    },
  },

  Borrow: {
    user: async (parent) => {
      return prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },

    book: async (parent) => {
      return prisma.book.findUnique({
        where: { id: parent.bookId },
      });
    },

    // Ensure dates are properly formatted as ISO strings
    borrowedAt: (parent) => {
      return parent.borrowedAt
        ? new Date(parent.borrowedAt).toISOString()
        : null;
    },

    dueDate: (parent) => {
      return parent.dueDate ? new Date(parent.dueDate).toISOString() : null;
    },

    returnedAt: (parent) => {
      return parent.returnedAt
        ? new Date(parent.returnedAt).toISOString()
        : null;
    },
  },
};
