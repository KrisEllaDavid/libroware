const { PrismaClient } = require("../../../generated/prisma");
const prisma = new PrismaClient();

module.exports = {
  Query: {
    review: async (_, { id }) => {
      return prisma.review.findUnique({ where: { id } });
    },

    bookReviews: async (_, { bookId, skip = 0, take = 10 }) => {
      return prisma.review.findMany({
        where: { bookId },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      });
    },
  },

  Mutation: {
    createReview: async (_, { input }) => {
      const { bookId, userEmail, userName, rating, comment } = input;

      // Check if book exists
      const book = await prisma.book.findUnique({ where: { id: bookId } });
      if (!book) {
        throw new Error("Book not found");
      }

      // Check if rating is valid (1-5)
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      // Check if user has already reviewed this book
      const existingReview = await prisma.review.findFirst({
        where: {
          bookId,
          userEmail,
        },
      });

      if (existingReview) {
        throw new Error("You have already reviewed this book");
      }

      // Create review
      return prisma.review.create({
        data: {
          book: { connect: { id: bookId } },
          userEmail,
          userName,
          rating,
          comment,
        },
        include: {
          book: true,
        },
      });
    },

    updateReview: async (_, { id, input }) => {
      // Check if review exists
      const review = await prisma.review.findUnique({ where: { id } });
      if (!review) {
        throw new Error("Review not found");
      }

      // Check if rating is valid if provided
      if (input.rating && (input.rating < 1 || input.rating > 5)) {
        throw new Error("Rating must be between 1 and 5");
      }

      // Update review
      return prisma.review.update({
        where: { id },
        data: input,
        include: {
          book: true,
        },
      });
    },

    deleteReview: async (_, { id }) => {
      // Check if review exists
      const review = await prisma.review.findUnique({ where: { id } });
      if (!review) {
        throw new Error("Review not found");
      }

      // Delete review
      return prisma.review.delete({
        where: { id },
        include: {
          book: true,
        },
      });
    },
  },

  Review: {
    book: async (parent) => {
      return prisma.book.findUnique({
        where: { id: parent.bookId },
      });
    },
  },
};
