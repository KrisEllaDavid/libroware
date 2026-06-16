const { computeAndSaveFine } = require("./fine");
const { createNotification, createNotificationsForStaff } = require("./notification");

module.exports = {
  Query: {
    borrow: async (_, { id }, { prisma }) => {
      await prisma.borrow.updateMany({
        where: { id, status: "BORROWED", dueDate: { lt: new Date() } },
        data: { status: "OVERDUE" },
      });

      return prisma.borrow.findUnique({
        where: { id },
        include: { user: true, book: { include: { authors: true } } },
      });
    },

    borrows: async (_, { skip = 0, take = 10, status }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Not authorized");

      const where = status ? { status } : {};

      // Only flip BORROWED→OVERDUE (never touch PENDING_APPROVAL)
      await prisma.borrow.updateMany({
        where: { status: "BORROWED", dueDate: { lt: new Date() } },
        data: { status: "OVERDUE" },
      });

      return prisma.borrow.findMany({
        where,
        skip,
        take,
        orderBy: { borrowedAt: "desc" },
        include: { user: true, book: { include: { authors: true } } },
      });
    },

    userBorrows: async (
      _,
      { userId, status, skip = 0, take = 20 },
      { userId: callerId, role, prisma }
    ) => {
      if (!callerId) throw new Error("Not authenticated");
      if (callerId !== userId && role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Not authorized");

      // Find borrows about to flip so we can notify the user
      const toBeOverdue = await prisma.borrow.findMany({
        where: { userId, status: "BORROWED", dueDate: { lt: new Date() } },
        include: { book: { select: { title: true } } },
      });

      await prisma.borrow.updateMany({
        where: { userId, status: "BORROWED", dueDate: { lt: new Date() } },
        data: { status: "OVERDUE" },
      });

      // Create one overdue notification per newly-flipped borrow (deduped per 24h)
      if (toBeOverdue.length > 0) {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        for (const b of toBeOverdue) {
          const alreadyNotified = await prisma.notification.findFirst({
            where: {
              userId,
              type: "OVERDUE_REMINDER",
              data: { path: ["borrowId"], equals: b.id },
              createdAt: { gt: dayAgo },
            },
          });
          if (!alreadyNotified) {
            await createNotification(prisma, {
              userId,
              type: "OVERDUE_REMINDER",
              title: "Book Overdue",
              message: `Your borrowed book "${b.book.title}" is now overdue. Please return it as soon as possible.`,
              link: "/dashboard",
              data: { borrowId: b.id, bookTitle: b.book.title },
            });
          }
        }
      }

      const where = { userId, ...(status && { status }) };
      return prisma.borrow.findMany({
        where,
        skip,
        take,
        orderBy: { borrowedAt: "desc" },
        include: { book: { include: { authors: true } } },
      });
    },

    borrowsCount: async (_, { status }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN") throw new Error("Not authorized");
      const where = status ? { status } : {};
      return prisma.borrow.count({ where });
    },

    overdueBorrows: async (_, __, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Not authorized");

      await prisma.borrow.updateMany({
        where: { status: "BORROWED", dueDate: { lt: new Date() } },
        data: { status: "OVERDUE" },
      });

      return prisma.borrow.findMany({
        where: { status: "OVERDUE" },
        orderBy: { dueDate: "asc" },
        include: { user: true, book: { include: { authors: true } } },
      });
    },
  },

  Mutation: {
    createBorrow: async (_, { input }, { userId: callerId, role, prisma }) => {
      if (!callerId) throw new Error("Not authenticated");

      const { userId, bookId, dueDate, note } = input;

      if (callerId !== userId && role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Not authorized to borrow on behalf of another user");

      const dueDateParsed = new Date(dueDate);
      if (isNaN(dueDateParsed.getTime()))
        throw new Error("Invalid dueDate format");
      if (dueDateParsed <= new Date())
        throw new Error("dueDate must be in the future");

      const isStaff = role === "ADMIN" || role === "LIBRARIAN";

      return prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        const book = await tx.book.findUnique({ where: { id: bookId } });
        if (!book) throw new Error("Book not found");

        if (book.available <= 0)
          throw new Error("Book is not available for borrowing");

        await tx.book.update({
          where: { id: bookId },
          data: { available: { decrement: 1 } },
        });

        // Staff checkouts go directly to BORROWED; member requests need approval
        const initialStatus = isStaff ? "BORROWED" : "PENDING_APPROVAL";

        const borrow = await tx.borrow.create({
          data: {
            user: { connect: { id: userId } },
            book: { connect: { id: bookId } },
            dueDate: dueDateParsed,
            status: initialStatus,
            ...(note && { note }),
          },
          include: { user: true, book: { include: { authors: true } } },
        });

        if (!isStaff) {
          const today = new Date();
          const isSameDay =
            dueDateParsed.toDateString() === today.toDateString();
          const borrowKind = isSameDay ? "Read" : "Borrow";
          await createNotificationsForStaff(tx, {
            type: "BORROW_REQUEST",
            title: `New ${borrowKind} Request`,
            message: `${user.firstName} ${user.lastName} requested to ${borrowKind.toLowerCase()} "${book.title}"`,
            link: "/admin?tab=pending",
            data: {
              borrowId: borrow.id,
              bookTitle: book.title,
              userName: `${user.firstName} ${user.lastName}`,
            },
          });
        }

        return borrow;
      });
    },

    updateBorrow: async (_, { id, input }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Not authorized");

      const borrow = await prisma.borrow.findUnique({ where: { id } });
      if (!borrow) throw new Error("Borrow record not found");

      const data = { ...input };

      if (input.dueDate !== undefined && input.dueDate !== null) {
        const parsedDueDate = new Date(input.dueDate);
        if (isNaN(parsedDueDate.getTime()))
          throw new Error("Invalid dueDate format");
        if (parsedDueDate <= new Date())
          throw new Error("New due date must be in the future");
        data.dueDate = parsedDueDate;

        if (borrow.status === "OVERDUE" && !input.status) {
          data.status = "BORROWED";
        }
      }

      return prisma.borrow.update({
        where: { id },
        data,
        include: { user: true, book: true },
      });
    },

    approveBorrow: async (_, { id }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Not authorized");

      const borrow = await prisma.borrow.findUnique({
        where: { id },
        include: { user: true, book: true },
      });
      if (!borrow) throw new Error("Borrow request not found");
      if (borrow.status !== "PENDING_APPROVAL")
        throw new Error("Borrow is not pending approval");

      const updated = await prisma.borrow.update({
        where: { id },
        data: { status: "BORROWED" },
        include: { user: true, book: true },
      });

      await createNotification(prisma, {
        userId: borrow.userId,
        type: "BORROW_APPROVED",
        title: "Borrow Request Approved",
        message: `Your request to borrow "${borrow.book.title}" has been approved. Due date: ${new Date(borrow.dueDate).toLocaleDateString()}.`,
        link: "/dashboard",
        data: { borrowId: borrow.id, bookTitle: borrow.book.title },
      });

      return updated;
    },

    rejectBorrow: async (_, { id, reason }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Not authorized");

      const borrow = await prisma.borrow.findUnique({
        where: { id },
        include: { user: true, book: true },
      });
      if (!borrow) throw new Error("Borrow request not found");
      if (borrow.status !== "PENDING_APPROVAL")
        throw new Error("Borrow is not pending approval");

      await prisma.$transaction(async (tx) => {
        await tx.book.update({
          where: { id: borrow.bookId },
          data: { available: { increment: 1 } },
        });
        await tx.borrow.delete({ where: { id } });

        await createNotification(tx, {
          userId: borrow.userId,
          type: "BORROW_REJECTED",
          title: "Borrow Request Not Approved",
          message: `Your request to borrow "${borrow.book.title}" was not approved.${reason ? ` Reason: ${reason}` : ""}`,
          link: "/dashboard",
          data: { bookTitle: borrow.book.title },
        });
      });

      return true;
    },

    cancelBorrowRequest: async (_, { id }, { userId: callerId, prisma }) => {
      if (!callerId) throw new Error("Not authenticated");

      const borrow = await prisma.borrow.findUnique({
        where: { id },
        include: { book: true },
      });
      if (!borrow) throw new Error("Borrow request not found");
      if (borrow.status !== "PENDING_APPROVAL")
        throw new Error("Can only cancel pending requests");
      if (borrow.userId !== callerId) throw new Error("Not authorized");

      await prisma.$transaction(async (tx) => {
        await tx.book.update({
          where: { id: borrow.bookId },
          data: { available: { increment: 1 } },
        });
        await tx.borrow.delete({ where: { id } });
      });

      return true;
    },

    returnBook: async (_, { id }, { userId: callerId, role, prisma }) => {
      if (!callerId) throw new Error("Not authenticated");

      const borrow = await prisma.borrow.findUnique({
        where: { id },
        include: { book: true },
      });
      if (!borrow) throw new Error("Borrow record not found");
      if (borrow.status === "RETURNED")
        throw new Error("Book is already returned");
      if (borrow.status === "PENDING_APPROVAL")
        throw new Error("Cannot return a book that is pending approval");

      if (borrow.userId !== callerId && role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Not authorized");

      const returnedAt = new Date();

      return prisma.$transaction(async (tx) => {
        await tx.book.update({
          where: { id: borrow.book.id },
          data: { available: { increment: 1 } },
        });

        const updated = await tx.borrow.update({
          where: { id },
          data: { status: "RETURNED", returnedAt },
          include: { user: true, book: true },
        });

        if (borrow.status === "OVERDUE" || returnedAt > new Date(borrow.dueDate)) {
          const fine = await computeAndSaveFine({ ...updated, returnedAt }, tx);
          if (fine) {
            await createNotification(tx, {
              userId: updated.userId,
              type: "FINE_ISSUED",
              title: "Late Return Fine Issued",
              message: `A fine of ${fine.amount.toLocaleString()} FCFA has been recorded for the late return of "${updated.book.title}".`,
              link: "/dashboard",
              data: { borrowId: updated.id, bookTitle: updated.book.title, amount: fine.amount },
            });
          }
        }

        const nextReservation = await tx.reservation.findFirst({
          where: { bookId: borrow.bookId, status: "PENDING" },
          orderBy: { createdAt: "asc" },
        });
        if (nextReservation) {
          const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
          await tx.reservation.update({
            where: { id: nextReservation.id },
            data: { status: "FULFILLED", expiresAt },
          });
          await createNotification(tx, {
            userId: nextReservation.userId,
            type: "RESERVATION_READY",
            title: "Your Reserved Book is Available",
            message: `"${borrow.book.title}" is now available for pickup. Please collect it within 48 hours.`,
            link: "/dashboard",
            data: { reservationId: nextReservation.id, bookTitle: borrow.book.title },
          });
        }

        return updated;
      });
    },
  },

  Borrow: {
    user: async (parent, _, { prisma }) => {
      if (parent.user) return parent.user;
      return prisma.user.findUnique({ where: { id: parent.userId } });
    },

    book: async (parent, _, { prisma }) => {
      if (parent.book) return parent.book;
      return prisma.book.findUnique({ where: { id: parent.bookId } });
    },

    fine: async (parent, _, { prisma }) => {
      if (parent.fine) return parent.fine;
      return prisma.fine.findUnique({ where: { borrowId: parent.id } });
    },

    borrowedAt: (parent) =>
      parent.borrowedAt ? new Date(parent.borrowedAt).toISOString() : null,

    dueDate: (parent) =>
      parent.dueDate ? new Date(parent.dueDate).toISOString() : null,

    returnedAt: (parent) =>
      parent.returnedAt ? new Date(parent.returnedAt).toISOString() : null,
  },
};
