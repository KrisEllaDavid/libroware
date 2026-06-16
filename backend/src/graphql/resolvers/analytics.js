module.exports = {
  Query: {
    // ── Single call returning all KPIs ─────────────────────────────────────
    dashboardStats: async (_, __, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN") throw new Error("Not authorized");

      const now       = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        bookAgg,
        totalUsers,
        activeUsers,
        totalBorrows,
        borrowsThisMonth,
        overdueBorrows,
        totalReservations,
        fineAgg,
      ] = await Promise.all([
        // Book aggregations
        prisma.book.aggregate({
          where: { deletedAt: null },
          _sum:   { quantity: true, available: true },
          _count: { id: true },
        }),

        // User counts
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.user.count({
          where: {
            deletedAt: null,
            borrowedBooks: { some: { borrowedAt: { gte: new Date(Date.now() - 30 * 86400000) } } },
          },
        }),

        // Borrow counts
        prisma.borrow.count(),
        prisma.borrow.count({ where: { borrowedAt: { gte: monthStart } } }),
        prisma.borrow.count({ where: { status: "OVERDUE" } }),

        // Reservations
        prisma.reservation.count({ where: { status: "PENDING" } }),

        // Fine aggregations
        prisma.fine.aggregate({
          _sum: { amount: true },
          where: { waived: false, paidAt: null },
        }),
      ]);

      const [collectedAgg, waivedAgg] = await Promise.all([
        prisma.fine.aggregate({ _sum: { amount: true }, where: { paidAt: { not: null } } }),
        prisma.fine.aggregate({ _sum: { amount: true }, where: { waived: true } }),
      ]);

      const total    = bookAgg._count.id;
      const available = bookAgg._sum.available ?? 0;

      return {
        totalBooks:        total,
        availableBooks:    available,
        borrowedBooks:     (bookAgg._sum.quantity ?? 0) - available,
        overdueBooks:      overdueBorrows,
        totalUsers,
        activeUsers,
        totalBorrows,
        borrowsThisMonth,
        totalReservations,
        outstandingFines: fineAgg._sum.amount     ?? 0,
        collectedFines:   collectedAgg._sum.amount ?? 0,
        waivedFines:      waivedAgg._sum.amount    ?? 0,
      };
    },

    // ── Borrows + returns per calendar month ───────────────────────────────
    borrowTrends: async (_, { months = 12 }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN") throw new Error("Not authorized");

      const points = [];
      const now    = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const [borrows, returns] = await Promise.all([
          prisma.borrow.count({ where: { borrowedAt: { gte: start, lt: end } } }),
          prisma.borrow.count({ where: { returnedAt: { gte: start, lt: end } } }),
        ]);

        points.push({
          month: start.toLocaleString("default", { month: "short", year: "2-digit" }),
          borrows,
          returns,
        });
      }

      return points;
    },

    // ── Most borrowed books by total borrow count ──────────────────────────
    topBorrowedBooks: async (_, { take = 10 }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN") throw new Error("Not authorized");

      const grouped = await prisma.borrow.groupBy({
        by:      ["bookId"],
        _count:  { bookId: true },
        orderBy: { _count: { bookId: "desc" } },
        take,
      });

      if (grouped.length === 0) return [];

      const books = await prisma.book.findMany({
        where:  { id: { in: grouped.map(g => g.bookId) } },
        select: { id: true, title: true },
      });

      const bookMap = new Map(books.map(b => [b.id, b.title]));

      return grouped.map(g => ({
        bookId: g.bookId,
        title:  bookMap.get(g.bookId) ?? "Unknown",
        count:  g._count.bookId,
      }));
    },

    // ── Audit log ─────────────────────────────────────────────────────────
    auditLogs: async (_, { skip = 0, take = 50, model, action, userId: targetUserId }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN") throw new Error("Not authorized");

      const where = {
        ...(model  && { model }),
        ...(action && { action }),
        ...(targetUserId && { userId: targetUserId }),
      };

      const logs = await prisma.auditLog.findMany({
        where,
        skip, take,
        orderBy: { createdAt: "desc" },
      });

      // Batch-fetch actors in one query instead of one lookup per row.
      // Not filtered by deletedAt so soft/hard-deleted users still resolve
      // a name instead of leaving the actor column blank.
      const actorIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))];
      const actors = actorIds.length
        ? await prisma.user.findMany({ where: { id: { in: actorIds } } })
        : [];
      const actorById = new Map(actors.map((a) => [a.id, a]));

      return logs.map((log) => ({
        ...log,
        user: log.userId ? actorById.get(log.userId) ?? null : null,
      }));
    },

    auditLogCount: async (_, { model, action, userId: targetUserId }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN") throw new Error("Not authorized");

      const where = {
        ...(model  && { model }),
        ...(action && { action }),
        ...(targetUserId && { userId: targetUserId }),
      };

      return prisma.auditLog.count({ where });
    },

    // ── Borrow count broken down by category ───────────────────────────────
    categoryBorrowStats: async (_, __, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN") throw new Error("Not authorized");

      const borrows = await prisma.borrow.findMany({
        select: { book: { select: { categories: { select: { name: true } } } } },
      });

      const counts = new Map();
      borrows.forEach(b => {
        b.book.categories.forEach(c => {
          counts.set(c.name, (counts.get(c.name) ?? 0) + 1);
        });
      });

      return Array.from(counts.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);
    },
  },
};
