/**
 * Librarian User Creation Script
 * This script creates a librarian user for the Libroware application.
 */

const { PrismaClient } = require("../../generated/prisma");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

// Librarian configuration
const LIBRARIAN = {
  email: "head.librarian@libroware.com",
  password: "Librarian123!",
  firstName: "Head",
  lastName: "Librarian",
  role: "LIBRARIAN",
  requiresPasswordChange: false,
  profilePicture:
    "https://ui-avatars.com/api/?name=Head+Librarian&background=FFA500&color=fff",
};

// Create librarian user
async function createLibrarian() {
  console.log("Creating librarian user...");

  try {
    // Check if librarian already exists
    const existingLibrarian = await prisma.user.findUnique({
      where: { email: LIBRARIAN.email },
    });

    if (existingLibrarian) {
      console.log("Librarian user already exists:", existingLibrarian.email);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(LIBRARIAN.password, 10);

    // Create librarian user
    const librarian = await prisma.user.create({
      data: {
        email: LIBRARIAN.email,
        password: hashedPassword,
        firstName: LIBRARIAN.firstName,
        lastName: LIBRARIAN.lastName,
        role: LIBRARIAN.role,
        profilePicture: LIBRARIAN.profilePicture,
        requiresPasswordChange: LIBRARIAN.requiresPasswordChange,
      },
    });

    console.log("Librarian user created successfully:");
    console.log("Email:", librarian.email);
    console.log("Password:", LIBRARIAN.password);
    console.log("Role:", librarian.role);
  } catch (error) {
    console.error("Error creating librarian user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createLibrarian().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
