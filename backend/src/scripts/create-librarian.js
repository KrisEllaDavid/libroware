const { PrismaClient } = require("../../generated/prisma");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();

function generatePassword() {
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

async function createLibrarian() {
  const args = parseArgs();

  const email     = args.email     || process.env.LIBRARIAN_EMAIL    || "head.librarian@libroware.com";
  const password  = args.password  || process.env.LIBRARIAN_PASSWORD || generatePassword();
  const firstName = args.firstName || "Head";
  const lastName  = args.lastName  || "Librarian";

  console.log("Creating librarian user...");

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log("Librarian already exists:", email);
      return;
    }

    const hashed = await bcrypt.hash(password, 10);

    const librarian = await prisma.user.create({
      data: {
        email,
        password: hashed,
        firstName,
        lastName,
        role: "LIBRARIAN",
        requiresPasswordChange: true,
        profilePicture: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=059669&color=fff`,
      },
    });

    console.log("Librarian user created:");
    console.log("  Email:   ", librarian.email);
    console.log("  Password:", password, "← change this on first login");
    console.log("  Role:    ", librarian.role);
  } finally {
    await prisma.$disconnect();
  }
}

createLibrarian().catch((e) => { console.error(e); process.exit(1); });
