/**
 * Admin User Management Script
 * This script provides functionality to create admin users for the Libroware application.
 *
 * Usage:
 * - To create default admin: node scripts/create-admin.js
 * - To create custom admin: node scripts/create-admin.js email=custom@example.com password=SecurePass123
 */

const { PrismaClient } = require("../../generated/prisma");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

// Default admin configuration
const DEFAULT_ADMIN = {
  email: "admin@libroware.com",
  password: "Admin123!",
  firstName: "Admin",
  lastName: "User",
  role: "ADMIN",
  requiresPasswordChange: false,
  profilePicture:
    "https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff",
};

/**
 * Parse command line arguments in the format key=value
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsedArgs = {};

  args.forEach((arg) => {
    const [key, value] = arg.split("=");
    if (key && value) {
      parsedArgs[key] = value;
    }
  });

  return parsedArgs;
}

/**
 * Create an admin user with the provided details or defaults
 */
async function createAdmin() {
  console.log("Creating admin user...");

  try {
    // Parse command line arguments
    const args = parseArgs();

    // Create admin config by merging defaults with command line arguments
    const adminConfig = {
      ...DEFAULT_ADMIN,
      ...args,
    };

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminConfig.email },
    });

    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.email);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminConfig.password, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminConfig.email,
        password: hashedPassword,
        firstName: adminConfig.firstName,
        lastName: adminConfig.lastName,
        role: adminConfig.role,
        profilePicture: adminConfig.profilePicture,
        requiresPasswordChange:
          adminConfig.requiresPasswordChange === "true" ||
          adminConfig.requiresPasswordChange === true,
      },
    });

    console.log("Admin user created successfully:");
    console.log("Email:", admin.email);
    console.log("Password:", adminConfig.password); // Note: Only show in development
    console.log("Role:", admin.role);
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdmin().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
