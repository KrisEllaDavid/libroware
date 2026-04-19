module.exports = {
  Query: {
    book: async (_, { id }, { prisma }) => {
      const book = await prisma.book.findUnique({
        where: { id },
        include: { authors: true, categories: true },
      });
      if (book?.deletedAt) return null;
      return book;
    },

    books: async (_, { skip = 0, take = 10, searchTitle }, { prisma }) => {
      const where = { deletedAt: null };
      if (searchTitle) where.title = { contains: searchTitle, mode: "insensitive" };

      return prisma.book.findMany({
        where,
        skip,
        take,
        orderBy: { title: "asc" },
        include: { authors: true, categories: true },
      });
    },

    booksByAuthor: async (_, { authorId, skip = 0, take = 10 }, { prisma }) => {
      return prisma.book.findMany({
        where: { deletedAt: null, authors: { some: { id: authorId } } },
        skip,
        take,
        orderBy: { title: "asc" },
        include: { authors: true, categories: true },
      });
    },

    booksByCategory: async (
      _,
      { categoryId, skip = 0, take = 10 },
      { prisma }
    ) => {
      return prisma.book.findMany({
        where: { deletedAt: null, categories: { some: { id: categoryId } } },
        skip,
        take,
        orderBy: { title: "asc" },
        include: { authors: true, categories: true },
      });
    },
  },

  Mutation: {
    createBook: async (_, { input }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Only librarians and admins can create books");

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

      if (!pageCount || pageCount < 1)
        throw new Error("pageCount must be at least 1");
      if (!quantity || quantity < 1)
        throw new Error("quantity must be at least 1");

      const existingBook = await prisma.book.findUnique({ where: { isbn } });
      if (existingBook) throw new Error("Book with this ISBN already exists");

      const parsedDate = new Date(publishedAt);
      if (isNaN(parsedDate.getTime()))
        throw new Error("Invalid date format for publishedAt");

      return prisma.book.create({
        data: {
          title,
          isbn,
          description,
          publishedAt: parsedDate,
          coverImage,
          pageCount,
          quantity,
          available: quantity,
          authors: { connect: authorIds.map((id) => ({ id })) },
          categories: { connect: categoryIds.map((id) => ({ id })) },
        },
        include: { authors: true, categories: true },
      });
    },

    updateBook: async (_, args, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Only librarians and admins can update books");

      const { id } = args;
      const input = args.input || args.data || {};

      const book = await prisma.book.findUnique({ where: { id } });
      if (!book || book.deletedAt) throw new Error("Book not found");

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

      if (title !== undefined) updateData.title = title;
      if (isbn !== undefined) updateData.isbn = isbn;
      if (description !== undefined) updateData.description = description;
      if (publishedAt !== undefined) {
        const parsedDate = new Date(publishedAt);
        if (isNaN(parsedDate.getTime()))
          throw new Error("Invalid date format for publishedAt");
        updateData.publishedAt = parsedDate;
      }
      if (coverImage !== undefined) updateData.coverImage = coverImage;
      if (pageCount !== undefined) {
        if (pageCount < 1) throw new Error("pageCount must be at least 1");
        updateData.pageCount = pageCount;
      }
      if (quantity !== undefined) {
        if (quantity < 1) throw new Error("quantity must be at least 1");
        updateData.quantity = quantity;
      }
      if (available !== undefined) updateData.available = available;

      if (authorIds && authorIds.length > 0) {
        updateData.authors = {
          set: [],
          connect: authorIds.map((id) => ({ id })),
        };
      }

      if (categoryIds && categoryIds.length > 0) {
        updateData.categories = {
          set: [],
          connect: categoryIds.map((id) => ({ id })),
        };
      }

      return prisma.book.update({
        where: { id },
        data: updateData,
        include: { authors: true, categories: true },
      });
    },

    deleteBook: async (_, { id }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Only librarians and admins can delete books");

      const book = await prisma.book.findUnique({ where: { id } });
      if (!book || book.deletedAt) throw new Error("Book not found");

      const activeBorrows = await prisma.borrow.findMany({
        where: { bookId: id, status: "BORROWED" },
      });

      if (activeBorrows.length > 0)
        throw new Error("Cannot delete book because it is currently borrowed");

      return prisma.book.update({
        where: { id },
        data: { deletedAt: new Date() },
        include: { authors: true, categories: true },
      });
    },
  },

  Book: {
    // authors and categories are eagerly loaded in all queries above;
    // these fallbacks handle direct book queries that may not include them.
    authors: async (parent, _, { prisma }) => {
      if (parent.authors) return parent.authors;
      return prisma.author.findMany({
        where: { books: { some: { id: parent.id } } },
      });
    },

    categories: async (parent, _, { prisma }) => {
      if (parent.categories) return parent.categories;
      return prisma.category.findMany({
        where: { books: { some: { id: parent.id } } },
      });
    },

    borrows: async (parent, _, { prisma }) => {
      return prisma.borrow.findMany({ where: { bookId: parent.id } });
    },

    reviews: async (parent, _, { prisma }) => {
      return prisma.review.findMany({ where: { bookId: parent.id } });
    },
  },
};
