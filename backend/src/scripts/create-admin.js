const { PrismaClient } = require("../../generated/prisma");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();

function generatePassword() {
  // 16 random bytes → 22-char base64url string, always meets 8-char minimum
  return crypto.randomBytes(16).toString("base64url");
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  args.forEach((arg) => {
    const [key, value] = arg.split("=");
    if (key && value) parsed[key] = value;
  });
  return parsed;
}

async function createAdmin() {
  const args = parseArgs();

  const email     = args.email     || process.env.ADMIN_EMAIL    || "admin@libroware.com";
  const password  = args.password  || process.env.ADMIN_PASSWORD || generatePassword();
  const firstName = args.firstName || "Admin";
  const lastName  = args.lastName  || "User";

  console.log("Creating admin user...");

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log("Admin already exists:", email);
      return;
    }

    const hashed = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        email,
        password: hashed,
        firstName,
        lastName,
        role: "ADMIN",
        requiresPasswordChange: true,
        profilePicture: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=0D8ABC&color=fff`,
      },
    });

    console.log("Admin user created:");
    console.log("  Email:   ", admin.email);
    console.log("  Password:", password, "← change this on first login");
    console.log("  Role:    ", admin.role);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin().catch((e) => { console.error(e); process.exit(1); });
