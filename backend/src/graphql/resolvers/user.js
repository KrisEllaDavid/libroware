const { PrismaClient } = require("../../../generated/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

module.exports = {
  Query: {
    me: async (_, __, { userId }) => {
      if (!userId) return null;
      return prisma.user.findUnique({ where: { id: userId } });
    },

    user: async (_, { id }, { userId }) => {
      return prisma.user.findUnique({ where: { id } });
    },

    users: async (_, { skip = 0, take = 10 }, { userId }) => {
      return prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
      });
    },
  },

  Mutation: {
    signup: async (_, { input }, { prisma }) => {
      try {
        const { email, password, firstName, lastName } = input;

        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          throw new Error("User already exists with this email");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            requiresPasswordChange: true,
          },
        });

        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
            requiresPasswordChange: user.requiresPasswordChange,
          },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        return {
          token,
          user,
        };
      } catch (error) {
        throw new Error(error.message);
      }
    },

    login: async (_, { input }, context) => {
      try {
        const { email, password } = input;

        // Use the module-level prisma instance
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error("No user found with this email");
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
          throw new Error("Invalid password");
        }

        // Generate token
        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
            requiresPasswordChange: user.requiresPasswordChange,
          },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        console.log("Login successful for:", email);
        return {
          token,
          user,
        };
      } catch (error) {
        console.error("Login error:", error);
        throw new Error(error.message);
      }
    },

    createUser: async (_, { input }, { userId }) => {
      const {
        email,
        password,
        firstName,
        lastName,
        role = "USER",
        profilePicture,
        requiresPasswordChange = true,
      } = input;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      return prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role,
          profilePicture,
          requiresPasswordChange,
        },
      });
    },

    updateUser: async (_, { id, input }, context) => {
      try {
        // Extract userId and role from context
        const userId = context.userId;
        const role = context.role;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { id },
        });

        if (!existingUser) {
          throw new Error("User not found");
        }

        // Only allow admins or the user themselves to update
        if (role !== "ADMIN" && userId !== id) {
          throw new Error("Not authorized");
        }

        // If updating email, check if new email already exists
        if (input.email && input.email !== existingUser.email) {
          const emailExists = await prisma.user.findUnique({
            where: { email: input.email },
          });

          if (emailExists) {
            throw new Error("Email already in use");
          }
        }

        // Hash password if it's provided
        let data = { ...input };
        if (input.password) {
          data.password = await bcrypt.hash(input.password, 10);

          // If the user is changing their password, set requiresPasswordChange to false
          if (userId === id) {
            data.requiresPasswordChange = false;
          }
        }

        const updatedUser = await prisma.user.update({
          where: { id },
          data,
        });

        return updatedUser;
      } catch (error) {
        throw new Error(error.message);
      }
    },

    deleteUser: async (_, { id }, { userId }) => {
      try {
        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
          throw new Error("User not found");
        }

        // Use a transaction to ensure all related records are deleted
        return await prisma.$transaction(async (tx) => {
          // 1. Delete all borrows associated with the user
          await tx.borrow.deleteMany({
            where: { userId: id },
          });

          // 2. Delete any reviews created by this user (based on email)
          await tx.review.deleteMany({
            where: { userEmail: user.email },
          });

          // 3. Finally delete the user
          return tx.user.delete({ where: { id } });
        });
      } catch (error) {
        console.error("Delete user error:", error);
        throw new Error(`Failed to delete user: ${error.message}`);
      }
    },

    forceDeleteUser: async (_, { id }, context) => {
      try {
        // Extract userId and role from context, which might have different structures
        const userId = context.userId;
        const role = context.role;

        console.log(
          "Force delete user request by:",
          userId,
          "with role:",
          role
        );

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
          throw new Error("User not found");
        }

        // Only admins can force delete
        if (role !== "ADMIN") {
          throw new Error(
            "Not authorized. Only administrators can force delete users."
          );
        }

        console.log(
          `Force deleting user ${id} (${user.email}) and all associated records...`
        );

        // Begin transaction to delete all related records
        const result = await prisma.$transaction(async (tx) => {
          // 1. Find and log all borrows by this user for debugging
          const userBorrows = await tx.borrow.findMany({
            where: { userId: id },
            include: { book: true },
          });
          console.log(
            `Found ${userBorrows.length} borrows to delete for user:`,
            id
          );

          // 2. Delete all borrows associated with the user
          await tx.borrow.deleteMany({
            where: { userId: id },
          });
          console.log(`Deleted ${userBorrows.length} borrows for user:`, id);

          // 3. Find and log all reviews by this user for debugging
          const userReviews = await tx.review.findMany({
            where: { userEmail: user.email },
            include: { book: true },
          });
          console.log(
            `Found ${userReviews.length} reviews to delete for user:`,
            user.email
          );

          // 4. Delete any reviews created by this user
          await tx.review.deleteMany({
            where: { userEmail: user.email },
          });
          console.log(
            `Deleted ${userReviews.length} reviews for user:`,
            user.email
          );

          // 5. Finally delete the user
          const deletedUser = await tx.user.delete({
            where: { id },
          });
          console.log(`Successfully deleted user:`, deletedUser.id);

          return deletedUser;
        });

        return result;
      } catch (error) {
        console.error("Force delete user error:", error);
        throw new Error(`Force delete failed: ${error.message}`);
      }
    },
  },

  User: {
    borrowedBooks: async (parent) => {
      return prisma.borrow.findMany({
        where: { userId: parent.id },
      });
    },
    requiresPasswordChange: (parent) => {
      return parent.requiresPasswordChange === null
        ? false
        : parent.requiresPasswordChange;
    },
  },
};
