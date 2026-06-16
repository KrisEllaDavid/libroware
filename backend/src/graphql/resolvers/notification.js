/**
 * Creates a single notification for a user.
 * Called within transactions (pass tx) or plain prisma client.
 */
const createNotification = async (prisma, { userId, type, title, message, link = null, data = null }) => {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        read: false,
        ...(link !== null && { link }),
        ...(data !== null && { data }),
      },
    });
  } catch (e) {
    console.error("Failed to create notification:", e.message);
    return null;
  }
};

/**
 * Creates a notification for every ADMIN and LIBRARIAN user.
 */
const createNotificationsForStaff = async (prisma, notifData) => {
  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "LIBRARIAN"] }, deletedAt: null },
    select: { id: true },
  });
  await Promise.all(staff.map((s) => createNotification(prisma, { userId: s.id, ...notifData })));
};

module.exports = {
  Query: {
    notifications: async (_, { skip = 0, take = 30, unreadOnly = false }, { userId, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      return prisma.notification.findMany({
        where: { userId, ...(unreadOnly && { read: false }) },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      });
    },

    unreadNotificationsCount: async (_, __, { userId, prisma }) => {
      if (!userId) return 0;
      return prisma.notification.count({ where: { userId, read: false } });
    },
  },

  Mutation: {
    markNotificationRead: async (_, { id }, { userId, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      const notif = await prisma.notification.findUnique({ where: { id } });
      if (!notif || notif.userId !== userId) throw new Error("Notification not found");
      return prisma.notification.update({ where: { id }, data: { read: true } });
    },

    markAllNotificationsRead: async (_, __, { userId, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
      return true;
    },
  },

  Notification: {
    createdAt: (parent) =>
      parent.createdAt ? new Date(parent.createdAt).toISOString() : null,
  },

  // Exported helpers — used by borrow.js, reservation.js, etc.
  createNotification,
  createNotificationsForStaff,
};
