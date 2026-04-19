module.exports = {
  Query: {
    category: async (_, { id }, { prisma }) => {
      return prisma.category.findUnique({ where: { id } });
    },

    categories: async (_, { skip = 0, take = 10 }, { prisma }) => {
      return prisma.category.findMany({
        skip,
        take,
        orderBy: { name: "asc" },
      });
    },
  },

  Mutation: {
    createCategory: async (_, { input }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Only librarians and admins can create categories");

      const { name, description } = input;

      const existingCategory = await prisma.category.findUnique({
        where: { name },
      });
      if (existingCategory)
        throw new Error("Category with this name already exists");

      return prisma.category.create({ data: { name, description } });
    },

    updateCategory: async (_, { id, input }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Only librarians and admins can update categories");

      const category = await prisma.category.findUnique({ where: { id } });
      if (!category) throw new Error("Category not found");

      if (input.name && input.name !== category.name) {
        const existingCategory = await prisma.category.findUnique({
          where: { name: input.name },
        });
        if (existingCategory)
          throw new Error("Category with this name already exists");
      }

      return prisma.category.update({ where: { id }, data: input });
    },

    deleteCategory: async (_, { id }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Only librarians and admins can delete categories");

      const category = await prisma.category.findUnique({ where: { id } });
      if (!category) throw new Error("Category not found");

      const categoryBooks = await prisma.book.findMany({
        where: { categories: { some: { id } } },
      });

      if (categoryBooks.length > 0)
        throw new Error(
          "Cannot delete category because it has associated books"
        );

      return prisma.category.delete({ where: { id } });
    },
  },

  Category: {
    books: async (parent, _, { prisma }) => {
      return prisma.book.findMany({
        where: { categories: { some: { id: parent.id } } },
        include: { authors: true, categories: true },
      });
    },
  },
};
