module.exports = {
  Query: {
    review: async (_, { id }, { prisma }) => {
      return prisma.review.findUnique({
        where: { id },
        include: { book: true },
      });
    },

    bookReviews: async (_, { bookId, skip = 0, take = 10 }, { prisma }) => {
      return prisma.review.findMany({
        where: { bookId },
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { book: true },
      });
    },
  },

  Mutation: {
    createReview: async (_, { input }, { userId, prisma }) => {
      if (!userId) throw new Error("Not authenticated");

      const { bookId, rating, comment } = input;

      if (rating < 1 || rating > 5)
        throw new Error("Rating must be between 1 and 5");
      if (comment && comment.length > 2000)
        throw new Error("Comment must be 2000 characters or fewer");

      const book = await prisma.book.findUnique({ where: { id: bookId } });
      if (!book) throw new Error("Book not found");

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      const existingReview = await prisma.review.findFirst({
        where: { bookId, userId },
      });
      if (existingReview) throw new Error("You have already reviewed this book");

      return prisma.review.create({
        data: {
          book: { connect: { id: bookId } },
          user: { connect: { id: userId } },
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`,
          rating,
          comment,
        },
        include: { book: true },
      });
    },

    updateReview: async (_, { id, input }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");

      const review = await prisma.review.findUnique({ where: { id } });
      if (!review) throw new Error("Review not found");

      // Only the author or an admin can update a review
      if (review.userId !== userId && role !== "ADMIN")
        throw new Error("Not authorized");

      if (input.rating !== undefined && (input.rating < 1 || input.rating > 5))
        throw new Error("Rating must be between 1 and 5");
      if (input.comment && input.comment.length > 2000)
        throw new Error("Comment must be 2000 characters or fewer");

      return prisma.review.update({
        where: { id },
        data: input,
        include: { book: true },
      });
    },

    deleteReview: async (_, { id }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");

      const review = await prisma.review.findUnique({ where: { id } });
      if (!review) throw new Error("Review not found");

      // Only the author or an admin can delete a review
      if (review.userId !== userId && role !== "ADMIN")
        throw new Error("Not authorized");

      return prisma.review.delete({
        where: { id },
        include: { book: true },
      });
    },
  },

  Review: {
    book: async (parent, _, { prisma }) => {
      if (parent.book) return parent.book;
      return prisma.book.findUnique({ where: { id: parent.bookId } });
    },
  },
};
