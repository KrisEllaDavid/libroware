const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "strict",
  // Enable secure flag only when HTTPS is in use. Set COOKIE_SECURE=true in .env
  // once you have a TLS certificate (see SERVER_CONFIG.md §7).
  secure: process.env.COOKIE_SECURE === "true",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — matches JWT expiry
  path: "/",
};

function setAuthCookie(res, token) {
  if (res) res.cookie("auth_token", token, COOKIE_OPTS);
}

module.exports = {
  Query: {
    me: async (_, __, { userId, prisma }) => {
      if (!userId) return null;
      return prisma.user.findUnique({ where: { id: userId } });
    },

    user: async (_, { id }, { userId, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user || user.deletedAt) return null;
      return user;
    },

    users: async (_, { skip = 0, take = 10 }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN")
        throw new Error("Not authorized");
      return prisma.user.findMany({
        where: { deletedAt: null },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      });
    },

    usersCount: async (_, __, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && role !== "LIBRARIAN") throw new Error("Not authorized");
      return prisma.user.count({ where: { deletedAt: null } });
    },

    deletedUsers: async (_, { skip = 0, take = 50 }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN") throw new Error("Not authorized");
      return prisma.user.findMany({
        where:   { deletedAt: { not: null } },
        skip, take,
        orderBy: { deletedAt: "desc" },
      });
    },
  },

  Mutation: {
    signup: async (_, { input }, context) => {
      const { prisma } = context;
      const { email, password, firstName, lastName } = input;

      if (!EMAIL_REGEX.test(email)) throw new Error("Invalid email format");
      if (!password || password.length < 8)
        throw new Error("Password must be at least 8 characters");

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser)
        throw new Error("User already exists with this email");

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

      setAuthCookie(context.res, token);
      return { token, user };
    },

    login: async (_, { input }, context) => {
      const { prisma } = context;
      const { email, password } = input;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error("No user found with this email");

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) throw new Error("Invalid password");

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

      setAuthCookie(context.res, token);
      return { token, user };
    },

    logout: (_, __, { res }) => {
      if (res) res.clearCookie("auth_token", { path: "/" });
      return true;
    },

    createUser: async (_, { input }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN")
        throw new Error("Only admins can create users directly");

      const {
        email,
        password,
        firstName,
        lastName,
        role: newRole = "USER",
        profilePicture,
        requiresPasswordChange = true,
      } = input;

      if (!EMAIL_REGEX.test(email)) throw new Error("Invalid email format");
      if (!password || password.length < 8)
        throw new Error("Password must be at least 8 characters");

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser)
        throw new Error("User with this email already exists");

      const hashedPassword = await bcrypt.hash(password, 10);

      return prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: newRole,
          profilePicture,
          requiresPasswordChange,
        },
      });
    },

    updateUser: async (_, { id, input }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && userId !== id)
        throw new Error("Not authorized");

      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser || existingUser.deletedAt) throw new Error("User not found");

      if (input.email && input.email !== existingUser.email) {
        if (!EMAIL_REGEX.test(input.email))
          throw new Error("Invalid email format");
        const emailExists = await prisma.user.findUnique({
          where: { email: input.email },
        });
        if (emailExists) throw new Error("Email already in use");
      }

      const data = { ...input };
      if (input.password) {
        if (input.password.length < 8)
          throw new Error("Password must be at least 8 characters");
        data.password = await bcrypt.hash(input.password, 10);
        if (userId === id) data.requiresPasswordChange = false;
      }

      return prisma.user.update({ where: { id }, data });
    },

    deleteUser: async (_, { id }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN" && userId !== id)
        throw new Error("Not authorized");

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user || user.deletedAt) throw new Error("User not found");

      return prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    },

    restoreUser: async (_, { id }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN") throw new Error("Only admins can restore users");

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) throw new Error("User not found");
      if (!user.deletedAt) throw new Error("User is not deleted");

      return prisma.user.update({ where: { id }, data: { deletedAt: null } });
    },

    hardDeleteUser: async (_, { id }, { userId, role, prisma }) => {
      if (!userId) throw new Error("Not authenticated");
      if (role !== "ADMIN") throw new Error("Only admins can permanently delete users");

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) throw new Error("User not found");

      return prisma.$transaction(async (tx) => {
        await tx.fine.deleteMany({ where: { userId: id } });
        await tx.reservation.deleteMany({ where: { userId: id } });
        await tx.borrow.deleteMany({ where: { userId: id } });
        await tx.review.deleteMany({ where: { userId: id } });
        return tx.user.delete({ where: { id } });
      });
    },

  },

  User: {
    borrowedBooks: async (parent, _, { prisma }) => {
      return prisma.borrow.findMany({ where: { userId: parent.id } });
    },
    requiresPasswordChange: (parent) => {
      return parent.requiresPasswordChange === null
        ? false
        : parent.requiresPasswordChange;
    },
  },
};
