const { PrismaClient } = require("../../../generated/prisma");
const prisma = new PrismaClient();

module.exports = {
  Query: {
    book: async (_, { id }) => {
      return prisma.book.findUnique({ where: { id } });
    },

    books: async (_, { skip = 0, take = 10, searchTitle }) => {
      const where = searchTitle
        ? { title: { contains: searchTitle, mode: "insensitive" } }
        : {};

      return prisma.book.findMany({
        where,
        skip,
        take,
        orderBy: { title: "asc" },
      });
    },

    booksByAuthor: async (_, { authorId, skip = 0, take = 10 }) => {
      return prisma.book.findMany({
        where: {
          authors: {
            some: {
              id: authorId,
            },
          },
        },
        skip,
        take,
        orderBy: { title: "asc" },
      });
    },

    booksByCategory: async (_, { categoryId, skip = 0, take = 10 }) => {
      return prisma.book.findMany({
        where: {
          categories: {
            some: {
              id: categoryId,
            },
          },
        },
        skip,
        take,
        orderBy: { title: "asc" },
      });
    },
  },

  Mutation: {
    createBook: async (_, { input }) => {
      const {
        title,
        isbn,
        description,
        publishedAt,
        coverImage,
        pageCount,
        quantity,
        authorIds = [],
        categoryIds = [],
      } = input;

      // Check if book with the same ISBN exists
      const existingBook = await prisma.book.findUnique({ where: { isbn } });
      if (existingBook) {
        throw new Error("Book with this ISBN already exists");
      }

      // Create connections to authors and categories
      const authorConnections = authorIds.map((id) => ({ id }));
      const categoryConnections = categoryIds.map((id) => ({ id }));

      // Create book
      // Parse the publishedAt date safely
      let parsedDate;
      try {
        parsedDate = new Date(publishedAt);
        if (isNaN(parsedDate.getTime())) {
          throw new Error("Invalid date format");
        }
      } catch (error) {
        throw new Error(
          `Invalid date format for publishedAt: ${error.message}`
        );
      }

      return prisma.book.create({
        data: {
          title,
          isbn,
          description,
          publishedAt: parsedDate,
          coverImage,
          pageCount,
          quantity,
          available: quantity, // Initial available count equals quantity
          authors: {
            connect: authorConnections,
          },
          categories: {
            connect: categoryConnections,
          },
        },
        include: {
          authors: true,
          categories: true,
        },
      });
    },

    updateBook: async (_, args) => {
      const { id } = args;
      // Allow input from both "input" and "data" parameters for backward compatibility
      const input = args.input || args.data || {};

      // Check if book exists
      const book = await prisma.book.findUnique({ where: { id } });
      if (!book) {
        throw new Error("Book not found");
      }

      const {
        title,
        isbn,
        description,
        publishedAt,
        coverImage,
        pageCount,
        quantity,
        available,
        authorIds,
        categoryIds,
      } = input;

      const updateData = {};

      // Basic fields
      if (title !== undefined) updateData.title = title;
      if (isbn !== undefined) updateData.isbn = isbn;
      if (description !== undefined) updateData.description = description;
      if (publishedAt !== undefined) {
        try {
          // Try to parse the date, ensuring it's a valid date
          const parsedDate = new Date(publishedAt);

          // Check if the date is valid
          if (!isNaN(parsedDate.getTime())) {
            updateData.publishedAt = parsedDate;
          } else {
            throw new Error("Invalid date format for publishedAt");
          }
        } catch (error) {
          throw new Error(
            `Invalid date format for publishedAt: ${error.message}`
          );
        }
      }
      if (coverImage !== undefined) updateData.coverImage = coverImage;
      if (pageCount !== undefined) updateData.pageCount = pageCount;
      if (quantity !== undefined) updateData.quantity = quantity;
      if (available !== undefined) updateData.available = available;

      // Handle relationships
      if (authorIds && authorIds.length > 0) {
        updateData.authors = {
          set: [], // Clear existing relationships
          connect: authorIds.map((id) => ({ id })),
        };
      }

      if (categoryIds && categoryIds.length > 0) {
        updateData.categories = {
          set: [], // Clear existing relationships
          connect: categoryIds.map((id) => ({ id })),
        };
      }

      // Update book
      return prisma.book.update({
        where: { id },
        data: updateData,
        include: {
          authors: true,
          categories: true,
        },
      });
    },

    deleteBook: async (_, { id }) => {
      // Check if book exists
      const book = await prisma.book.findUnique({ where: { id } });
      if (!book) {
        throw new Error("Book not found");
      }

      // Check if book is currently borrowed
      const activeBorrows = await prisma.borrow.findMany({
        where: {
          bookId: id,
          status: "BORROWED",
        },
      });

      if (activeBorrows.length > 0) {
        throw new Error("Cannot delete book because it is currently borrowed");
      }

      // Delete book
      return prisma.book.delete({
        where: { id },
        include: {
          authors: true,
          categories: true,
        },
      });
    },
  },

  Book: {
    authors: async (parent) => {
      return prisma.author.findMany({
        where: {
          books: {
            some: {
              id: parent.id,
            },
          },
        },
      });
    },

    categories: async (parent) => {
      return prisma.category.findMany({
        where: {
          books: {
            some: {
              id: parent.id,
            },
          },
        },
      });
    },

    borrows: async (parent) => {
      return prisma.borrow.findMany({
        where: { bookId: parent.id },
      });
    },

    reviews: async (parent) => {
      return prisma.review.findMany({
        where: { bookId: parent.id },
      });
    },
  },
};
