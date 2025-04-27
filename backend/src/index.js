const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const { readFileSync } = require("fs");
const { join } = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const resolvers = require("./graphql/resolvers");
const { PrismaClient } = require("../generated/prisma");

require("dotenv").config();

// Load schema from file
const typeDefs = readFileSync(
  join(__dirname, "graphql", "schema.graphql"),
  "utf8"
);

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Auth context function
const getUser = (token) => {
  if (!token) return { userId: null, role: null };

  try {
    // Verify token and extract userId and role
    const { userId, role } = jwt.verify(token, JWT_SECRET);
    return { userId, role };
  } catch (error) {
    console.error("Token verification error:", error.message);
    return { userId: null, role: null };
  }
};

const prisma = new PrismaClient();

async function startServer() {
  // Create Express app
  const app = express();

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (error) => {
      console.error("GraphQL Error:", error);
      return error;
    },
  });

  // Start Apollo Server
  await server.start();

  // Add route for root path
  app.get("/", (req, res) => {
    res.send("Libroware API server. Use /graphql for the GraphQL endpoint.");
  });

  // Apply middleware with proper CORS settings for mobile support
  app.use(
    "/graphql",
    cors({
      origin: "*", // Allow all origins during testing
      credentials: false, // Disable credentials for now to test connection
      allowedHeaders: ["*"], // Allow all headers
      methods: ["GET", "POST", "OPTIONS"],
      maxAge: 86400, // Cache preflight requests for 1 day
    }),
    express.json({ limit: "50mb" }),
    express.urlencoded({ limit: "50mb", extended: true }),
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Get token from Authorization header
        const token = req.headers.authorization?.replace("Bearer ", "");

        // For debugging
        console.log("Auth header:", req.headers.authorization);
        console.log("Request origin:", req.headers.origin);
        console.log("Request IP:", req.ip);

        // Get userId and role from token
        const { userId, role } = getUser(token);

        console.log("User ID from token:", userId);
        console.log("User role from token:", role);

        // Return context with userId, role and prisma client
        return {
          userId,
          role,
          prisma,
        };
      },
    })
  );

  // Define port
  const PORT = process.env.PORT || 4000;

  // Start server on all network interfaces instead of just localhost
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(
      `GraphQL endpoint is available at http://localhost:${PORT}/graphql`
    );
    console.log(
      `For external access, use your device's network IP address with port ${PORT}`
    );
  });
}

// Start server and catch any errors
startServer().catch((error) => {
  console.error("Error starting server:", error);
});
