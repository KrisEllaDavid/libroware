const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const { readFileSync } = require("fs");
const { join } = require("path");
const { AsyncLocalStorage } = require("async_hooks");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const resolvers = require("./graphql/resolvers");
const { PrismaClient } = require("../generated/prisma");

require("dotenv").config();

// Load schema from file
const typeDefs = readFileSync(
  join(__dirname, "graphql", "schema.graphql"),
  "utf8"
);

// JWT secret — must be set explicitly; no insecure fallback
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

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

const auditContext = new AsyncLocalStorage();

const baseClient = new PrismaClient();

const AUDITED_MODELS = ["User", "Book", "Borrow"];
const AUDITED_OPS = { create: "CREATE", update: "UPDATE", delete: "DELETE" };

const prisma = baseClient.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const result = await query(args);
        if (AUDITED_MODELS.includes(model) && AUDITED_OPS[operation]) {
          const store = auditContext.getStore();
          baseClient.auditLog
            .create({
              data: {
                model,
                action: AUDITED_OPS[operation],
                recordId: result?.id ?? JSON.stringify(args?.where) ?? "",
                userId: store?.userId ?? null,
              },
            })
            .catch(() => {});
        }
        return result;
      },
    },
  },
});

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

  // Rate limiting — 100 requests per 15 min per IP globally,
  // tighter 10 req/15 min for auth operations
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { errors: [{ message: "Too many attempts, please try again later." }] },
  });

  // Apply middleware with CORS settings
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : ["http://localhost:3000"];

  // Populate audit context with the requesting userId for every /graphql request
  app.use("/graphql", (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const { userId } = getUser(token);
    auditContext.run({ userId }, next);
  });

  app.use(
    "/graphql",
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (curl, server-to-server, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      },
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "OPTIONS"],
      maxAge: 86400,
    }),
    express.json({ limit: "50mb" }),
    express.urlencoded({ limit: "50mb", extended: true }),
    // Global limiter after body is parsed
    globalLimiter,
    // Tighter limit on login/signup — body is parsed so operationName is available
    (req, res, next) => {
      const op = req.body?.operationName?.toLowerCase();
      if (op === "login" || op === "signup") return authLimiter(req, res, next);
      next();
    },
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Get token from Authorization header
        const token = req.headers.authorization?.replace("Bearer ", "");

        // Get userId and role from token
        const { userId, role } = getUser(token);

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
