module.exports = {
  Query: {
    borrow: async (_, { id }, { prisma }) => {
      // Atomically mark as OVERDUE if past due date before returning
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

      // Bulk-update overdue borrows before returning results
      await prisma.borrow.updateMany({
        where: { ...where, status: "BORROWED", dueDate: { lt: new Date() } },
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
      // Users can only see their own borrows; staff can see anyone's
      if (callerId !== userId && role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Not authorized");

      const where = { userId, ...(status && { status }) };

      await prisma.borrow.updateMany({
        where: { userId, status: "BORROWED", dueDate: { lt: new Date() } },
        data: { status: "OVERDUE" },
      });

      return prisma.borrow.findMany({
        where,
        skip,
        take,
        orderBy: { borrowedAt: "desc" },
        include: { book: { include: { authors: true } } },
      });
    },

    overdueBorrows: async (_, __, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Not authorized");

      // Single bulk update then fetch — no per-row loop
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

      // Users can only borrow for themselves; staff can borrow on behalf of anyone
      if (callerId !== userId && role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Not authorized to borrow on behalf of another user");

      const dueDateParsed = new Date(dueDate);
      if (isNaN(dueDateParsed.getTime()))
        throw new Error("Invalid dueDate format");
      if (dueDateParsed <= new Date())
        throw new Error("dueDate must be in the future");

      // Availability check and decrement inside one transaction to prevent race condition
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

        return tx.borrow.create({
          data: {
            user: { connect: { id: userId } },
            book: { connect: { id: bookId } },
            dueDate: dueDateParsed,
            status: "BORROWED",
            ...(note && { note }),
          },
          include: { user: true, book: { include: { authors: true } } },
        });
      });
    },

    updateBorrow: async (_, { id, input }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Not authorized");

      const borrow = await prisma.borrow.findUnique({ where: { id } });
      if (!borrow) throw new Error("Borrow record not found");

      return prisma.borrow.update({
        where: { id },
        data: input,
        include: { user: true, book: true },
      });
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

      // Users can only return their own borrows
      if (borrow.userId !== callerId && role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Not authorized");

      return prisma.$transaction(async (tx) => {
        await tx.book.update({
          where: { id: borrow.book.id },
          data: { available: { increment: 1 } },
        });

        return tx.borrow.update({
          where: { id },
          data: { status: "RETURNED", returnedAt: new Date() },
          include: { user: true, book: true },
        });
      });
    },
  },

  Borrow: {
    // Fallback resolvers — only called if parent was fetched without include
    user: async (parent, _, { prisma }) => {
      if (parent.user) return parent.user;
      return prisma.user.findUnique({ where: { id: parent.userId } });
    },

    book: async (parent, _, { prisma }) => {
      if (parent.book) return parent.book;
      return prisma.book.findUnique({ where: { id: parent.bookId } });
    },

    borrowedAt: (parent) =>
      parent.borrowedAt ? new Date(parent.borrowedAt).toISOString() : null,

    dueDate: (parent) =>
      parent.dueDate ? new Date(parent.dueDate).toISOString() : null,

    returnedAt: (parent) =>
      parent.returnedAt ? new Date(parent.returnedAt).toISOString() : null,
  },
};
