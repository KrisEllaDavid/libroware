// Reservation expires after 48 hours if not collected once the book is available
const RESERVATION_EXPIRY_HOURS = 48;

module.exports = {
  Query: {
    reservation: async (_, { id }, { userId, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      return prisma.reservation.findUnique({
        where:   { id },
        include: { book: true, user: true },
      });
    },

    userReservations: async (_, { userId: targetId, skip = 0, take = 20 }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (userId !== targetId && role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Not authorized");

      // Expire stale PENDING reservations before returning
      await prisma.reservation.updateMany({
        where:  { userId: targetId, status: "PENDING", expiresAt: { lt: new Date() } },
        data:   { status: "EXPIRED" },
      });

      return prisma.reservation.findMany({
        where:   { userId: targetId },
        skip, take,
        orderBy: { createdAt: "desc" },
        include: { book: { include: { authors: true } } },
      });
    },

    bookReservations: async (_, { bookId, skip = 0, take = 20 }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN") throw new Error("Not authorized");
      return prisma.reservation.findMany({
        where:   { bookId, status: "PENDING" },
        skip, take,
        orderBy: { createdAt: "asc" }, // FIFO
        include: { user: true },
      });
    },
  },

  Mutation: {
    createReservation: async (_, { bookId }, { userId, prisma }) => {
      if (!userId) throw new Error("Not authenticated");

      const book = await prisma.book.findUnique({ where: { id: bookId } });
      if (!book || book.deletedAt) throw new Error("Book not found");

      // No need to reserve if copies are available
      if (book.available > 0) throw new Error("Book is currently available — borrow it directly");

      // Check for existing active reservation by this user for this book
      const existing = await prisma.reservation.findFirst({
        where: { bookId, userId, status: "PENDING" },
      });
      if (existing) throw new Error("You already have an active reservation for this book");

      const expiresAt = new Date(Date.now() + RESERVATION_EXPIRY_HOURS * 60 * 60 * 1000);

      return prisma.reservation.create({
        data:    { bookId, userId, expiresAt },
        include: { book: { include: { authors: true } }, user: true },
      });
    },

    cancelReservation: async (_, { id }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");

      const reservation = await prisma.reservation.findUnique({ where: { id } });
      if (!reservation) throw new Error("Reservation not found");

      if (reservation.userId !== userId && role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Not authorized");

      return prisma.reservation.update({
        where:   { id },
        data:    { status: "CANCELLED" },
        include: { book: true, user: true },
      });
    },
  },

  Reservation: {
    book: async (parent, _, { prisma }) => {
      if (parent.book) return parent.book;
      return prisma.book.findUnique({
        where:   { id: parent.bookId },
        include: { authors: true },
      });
    },
    user: async (parent, _, { prisma }) => {
      if (parent.user) return parent.user;
      return prisma.user.findUnique({ where: { id: parent.userId } });
    },
  },
};
