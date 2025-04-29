const { uploadImage } = require("../../utils/cloudinary");
const { PrismaClient } = require("../../../generated/prisma");

const prisma = new PrismaClient();

module.exports = {
  Mutation: {
    uploadProfilePicture: async (_, { userId, imageData }, context) => {
      try {
        // Check authentication
        if (!context.userId) {
          throw new Error("Not authenticated");
        }

        // Check authorization - only the user themselves or an admin can upload their profile picture
        if (context.userId !== userId && context.role !== "ADMIN") {
          throw new Error(
            "Not authorized to update this user's profile picture"
          );
        }

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          throw new Error("User not found");
        }

        // Upload image to Cloudinary
        const result = await uploadImage(imageData);

        // Update user's profile picture URL in the database
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
      } catch (error) {
        console.error("Error in uploadProfilePicture resolver:", error);
        return {
          success: false,
          message: error.message,
          user: null,
        };
      }
    },

    uploadFile: async (_, { file, type, id }, context) => {
      try {
        // Check authentication
        if (!context.userId) {
          throw new Error("Not authenticated");
        }

        // Process based on upload type
        switch (type) {
          case "PROFILE_PICTURE":
            // Check authorization - only the user themselves or an admin can upload their profile picture
            if (
              context.userId !== id &&
              context.role !== "ADMIN" &&
              context.role !== "LIBRARIAN"
            ) {
              throw new Error(
                "Not authorized to update this user's profile picture"
              );
            }

            // Check if user exists
            const user = await prisma.user.findUnique({ where: { id } });
            if (!user) {
              throw new Error("User not found");
            }

            // Upload image to Cloudinary in profile_pictures folder
            const profileResult = await uploadImage(file, "profile_pictures");

            // Update user's profile picture URL in the database
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

          case "BOOK_COVER":
            // Check authorization - only librarians and admins can update book covers
            if (context.role !== "ADMIN" && context.role !== "LIBRARIAN") {
              throw new Error("Not authorized to update book covers");
            }

            // Check if book exists
            const book = await prisma.book.findUnique({ where: { id } });
            if (!book) {
              throw new Error("Book not found");
            }

            // Upload image to Cloudinary in book_covers folder
            const bookResult = await uploadImage(file, "book_covers");

            // Update book's cover image URL in the database
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

          default:
            throw new Error("Invalid upload type");
        }
      } catch (error) {
        console.error("Error in uploadFile resolver:", error);
        return {
          success: false,
          message: error.message,
        };
      }
    },
  },
};
