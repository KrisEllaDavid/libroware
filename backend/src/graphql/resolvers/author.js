module.exports = {
  Query: {
    author: async (_, { id }, { prisma }) => {
      return prisma.author.findUnique({ where: { id } });
    },

    authors: async (_, { skip = 0, take = 10, searchName }, { prisma }) => {
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
    createAuthor: async (_, { input }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Only librarians and admins can create authors");

      const { name } = input;
      if (!name || !name.trim()) throw new Error("Author name is required");

      return prisma.author.create({ data: { name: name.trim() } });
    },

    updateAuthor: async (_, { id, input }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Only librarians and admins can update authors");

      const author = await prisma.author.findUnique({ where: { id } });
      if (!author) throw new Error("Author not found");

      return prisma.author.update({ where: { id }, data: input });
    },

    deleteAuthor: async (_, { id }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Only librarians and admins can delete authors");

      const author = await prisma.author.findUnique({ where: { id } });
      if (!author) throw new Error("Author not found");

      const authorBooks = await prisma.book.findMany({
        where: { authors: { some: { id } } },
      });

      if (authorBooks.length > 0)
        throw new Error(
          "Cannot delete author because they have associated books"
        );

      return prisma.author.delete({ where: { id } });
    },
  },

  Author: {
    books: async (parent, _, { prisma }) => {
      return prisma.book.findMany({
        where: { authors: { some: { id: parent.id } } },
        include: { authors: true, categories: true },
      });
    },
  },
};
