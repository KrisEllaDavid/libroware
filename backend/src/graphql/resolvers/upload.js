const { uploadImage } = require("../../utils/cloudinary");

module.exports = {
  Mutation: {
    uploadProfilePicture: async (_, { userId, imageData }, { userId: callerId, role, prisma }) => {
      if (!callerId) throw new Error("Not authenticated");
      if (callerId !== userId && role !== "ADMIN")
        throw new Error("Not authorized to update this user's profile picture");

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      const result = await uploadImage(imageData);
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profilePicture: result.secure_url },
      });

      return {
        success: true,
        message: "Profile picture uploaded successfully",
        url: result.secure_url,
        user: updatedUser,
      };
    },

    uploadFile: async (_, { file, type, id }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");

      switch (type) {
        case "PROFILE_PICTURE": {
          if (userId !== id && role !== "ADMIN" && role !== "LIBRARIAN")
            throw new Error(
              "Not authorized to update this user's profile picture"
            );

          const user = await prisma.user.findUnique({ where: { id } });
          if (!user) throw new Error("User not found");

          const profileResult = await uploadImage(file, "profile_pictures");
          const updatedUser = await prisma.user.update({
            where: { id },
            data: { profilePicture: profileResult.secure_url },
          });

          return {
            success: true,
            message: "Profile picture uploaded successfully",
            url: profileResult.secure_url,
            user: updatedUser,
          };
        }

        case "BOOK_COVER": {
          if (role !== "ADMIN" && role !== "LIBRARIAN")
            throw new Error("Not authorized to update book covers");

          const book = await prisma.book.findUnique({ where: { id } });
          if (!book) throw new Error("Book not found");

          const bookResult = await uploadImage(file, "book_covers");
          const updatedBook = await prisma.book.update({
            where: { id },
            data: { coverImage: bookResult.secure_url },
          });

          return {
            success: true,
            message: "Book cover uploaded successfully",
            url: bookResult.secure_url,
            book: updatedBook,
          };
        }

        default:
          throw new Error("Invalid upload type");
      }
    },
  },
};
