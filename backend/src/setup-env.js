const { PrismaClient } = require("../generated/prisma");
const fs = require("fs");
const path = require("path");

// First, create a proper .env file
const envContent = `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/libroware_db"
JWT_SECRET="libroware-jwt-secret-key"
PORT=4000
NODE_ENV=development
`;

const envPath = path.join(__dirname, "..", ".env");
fs.writeFileSync(envPath, envContent);
console.log(`Environment file created at: ${envPath}`);
console.log("Contents:", envContent);

// Then try to connect to the database
async function testDatabaseConnection() {
  console.log("Testing database connection...");

  // Create a new instance of PrismaClient
  const prisma = new PrismaClient();

  try {
    // Attempt to query the database
    console.log("Connecting to database with URL:", process.env.DATABASE_URL);
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("Database connection successful:", result);

    // Check for tables
    try {
      const users = await prisma.user.findMany({ take: 1 });
      console.log("User table exists, found users:", users.length);
      if (users.length > 0) {
        console.log("Sample user:", {
          id: users[0].id,
          email: users[0].email,
          role: users[0].role,
        });
      } else {
        console.log("No users found in the database");
      }
    } catch (error) {
      console.error("Error querying user table:", error.message);
    }
  } catch (error) {
    console.error("Error connecting to database:", error);

    // If the database doesn't exist, provide instructions
    if (error.message.includes("does not exist")) {
      console.log("\nThe database does not exist. Please create it with:");
      console.log("\nFor PostgreSQL:");
      console.log("1. Connect to PostgreSQL: psql -U postgres");
      console.log("2. Create database: CREATE DATABASE libroware_db;");
      console.log("3. Connect to the database: \\c libroware_db");
      console.log("4. Run migrations: npx prisma migrate dev");
      console.log("5. Seed the database: npx prisma db seed");
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection()
  .catch(console.error)
  .finally(() => {
    console.log("Test complete");
  });
