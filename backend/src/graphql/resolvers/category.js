const { PrismaClient } = require("../../../generated/prisma");
const prisma = new PrismaClient();

module.exports = {
  Query: {
    category: async (_, { id }) => {
      return prisma.category.findUnique({ where: { id } });
    },

    categories: async (_, { skip = 0, take = 10 }) => {
      return prisma.category.findMany({
        skip,
        take,
        orderBy: { name: "asc" },
      });
    },
  },

  Mutation: {
    createCategory: async (_, { input }) => {
      const { name, description } = input;

      // Check if category with the same name exists
      const existingCategory = await prisma.category.findUnique({
        where: { name },
      });

      if (existingCategory) {
        throw new Error("Category with this name already exists");
      }

      return prisma.category.create({
        data: {
          name,
          description,
        },
      });
    },

    updateCategory: async (_, { id, input }) => {
      // Check if category exists
      const category = await prisma.category.findUnique({ where: { id } });
      if (!category) {
        throw new Error("Category not found");
      }

      // Check if new name is unique if it's being updated
      if (input.name && input.name !== category.name) {
        const existingCategory = await prisma.category.findUnique({
          where: { name: input.name },
        });

        if (existingCategory) {
          throw new Error("Category with this name already exists");
        }
      }

      // Update category
      return prisma.category.update({
        where: { id },
        data: input,
      });
    },

    deleteCategory: async (_, { id }) => {
      // Check if category exists
      const category = await prisma.category.findUnique({ where: { id } });
      if (!category) {
        throw new Error("Category not found");
      }

      // Check if category has books
      const categoryBooks = await prisma.book.findMany({
        where: {
          categories: {
            some: {
              id,
            },
          },
        },
      });

      if (categoryBooks.length > 0) {
        throw new Error(
          "Cannot delete category because it has associated books"
        );
      }

      // Delete category
      return prisma.category.delete({ where: { id } });
    },
  },

  Category: {
    books: async (parent) => {
      return prisma.book.findMany({
        where: {
          categories: {
            some: {
              id: parent.id,
            },
          },
        },
      });
    },
  },
};
