// Fine rate stored in memory; in production this would live in a Settings table.
// Default: 100 FCFA per day overdue.
let FINE_RATE_PER_DAY = parseFloat(process.env.FINE_RATE_PER_DAY || "100");

/**
 * Compute the fine for a borrow and upsert it in the database.
 * Called automatically by returnBook resolver.
 */
async function computeAndSaveFine(borrow, prisma) {
  if (borrow.status !== "OVERDUE" && borrow.status !== "BORROWED") return null;

  const returnDate = borrow.returnedAt ? new Date(borrow.returnedAt) : new Date();
  const dueDate    = new Date(borrow.dueDate);

  if (returnDate <= dueDate) return null; // returned on time — no fine

  const msPerDay   = 1000 * 60 * 60 * 24;
  const daysOverdue = Math.ceil((returnDate - dueDate) / msPerDay);
  const amount      = daysOverdue * FINE_RATE_PER_DAY;

  return prisma.fine.upsert({
    where:  { borrowId: borrow.id },
    update: { daysOverdue, amount, dailyRate: FINE_RATE_PER_DAY },
    create: {
      borrowId:    borrow.id,
      userId:      borrow.userId,
      amount,
      dailyRate:   FINE_RATE_PER_DAY,
      daysOverdue,
    },
    include: { borrow: true },
  });
}

module.exports = {
  getFineRatePerDay: () => FINE_RATE_PER_DAY,
  computeAndSaveFine,

  Query: {
    fine: async (_, { borrowId }, { userId, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      return prisma.fine.findUnique({
        where:   { borrowId },
        include: { borrow: true },
      });
    },

    userFines: async (_, { userId: targetId, skip = 0, take = 20 }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (userId !== targetId && role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Not authorized");
      return prisma.fine.findMany({
        where:   { userId: targetId },
        skip, take,
        orderBy: { createdAt: "desc" },
        include: { borrow: { include: { book: true } } },
      });
    },

    allFines: async (_, { skip = 0, take = 20, waived }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN") throw new Error("Not authorized");
      const where = waived !== undefined ? { waived } : {};
      return prisma.fine.findMany({
        where, skip, take,
        orderBy: { createdAt: "desc" },
        include: { borrow: { include: { book: true, user: true } } },
      });
    },

    fineRatePerDay: (_, __, { userId, role }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN") throw new Error("Not authorized");
      return FINE_RATE_PER_DAY;
    },
  },

  Mutation: {
    waiveFine: async (_, { borrowId }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN") throw new Error("Not authorized");

      const fine = await prisma.fine.findUnique({ where: { borrowId } });
      if (!fine) throw new Error("Fine not found");

      return prisma.fine.update({
        where:  { borrowId },
        data:   { waived: true, waivedBy: userId, waivedAt: new Date() },
        include: { borrow: true },
      });
    },

    markFinePaid: async (_, { borrowId }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN") throw new Error("Not authorized");

      const fine = await prisma.fine.findUnique({ where: { borrowId } });
      if (!fine) throw new Error("Fine not found");

      return prisma.fine.update({
        where:  { borrowId },
        data:   { paidAt: new Date() },
        include: { borrow: true },
      });
    },

    setFineRate: async (_, { ratePerDay }, { userId, role }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN") throw new Error("Only admins can change the fine rate");
      if (ratePerDay < 0) throw new Error("Fine rate must be non-negative");
      FINE_RATE_PER_DAY = ratePerDay;
      return true;
    },
  },

  Fine: {
    borrow: async (parent, _, { prisma }) => {
      if (parent.borrow) return parent.borrow;
      return prisma.borrow.findUnique({ where: { id: parent.borrowId } });
    },
  },
};
