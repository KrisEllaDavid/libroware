const { PrismaClient } = require("../../../generated/prisma");
const prisma = new PrismaClient();

module.exports = {
  Query: {
    author: async (_, { id }) => {
      return prisma.author.findUnique({ where: { id } });
    },

    authors: async (_, { skip = 0, take = 10, searchName }) => {
      const where = searchName
        ? { name: { contains: searchName, mode: "insensitive" } }
        : {};

      return prisma.author.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
      });
    },
  },

  Mutation: {
    createAuthor: async (_, { input }) => {
      const { name } = input;

      return prisma.author.create({
        data: { name },
      });
    },

    updateAuthor: async (_, { id, input }) => {
      // Check if author exists
      const author = await prisma.author.findUnique({ where: { id } });
      if (!author) {
        throw new Error("Author not found");
      }

      // Update author
      return prisma.author.update({
        where: { id },
        data: input,
      });
    },

    deleteAuthor: async (_, { id }) => {
      // Check if author exists
      const author = await prisma.author.findUnique({ where: { id } });
      if (!author) {
        throw new Error("Author not found");
      }

      // Check if author has books
      const authorBooks = await prisma.book.findMany({
        where: {
          authors: {
            some: {
              id,
            },
          },
        },
      });

      if (authorBooks.length > 0) {
        throw new Error(
          "Cannot delete author because they have associated books"
        );
      }

      // Delete author
      return prisma.author.delete({ where: { id } });
    },
  },

  Author: {
    books: async (parent) => {
      return prisma.book.findMany({
        where: {
          authors: {
            some: {
              id: parent.id,
            },
          },
        },
      });
    },
  },
};
