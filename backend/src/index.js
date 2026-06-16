const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const { readFileSync } = require("fs");
const { join } = require("path");
const { AsyncLocalStorage } = require("async_hooks");
const crypto = require("crypto");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const resolvers = require("./graphql/resolvers");
const { PrismaClient } = require("../generated/prisma");
const { startNotificationScheduler } = require("./services/scheduler");

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

const AUDITED_MODELS = ["User", "Book", "Borrow", "Author", "Category", "Fine", "Reservation", "Review"];
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

  // Trust proxy — required for accurate IP identification when behind a proxy
  app.set("trust proxy", 1);

  // Parse cookies for httpOnly JWT auth
  app.use(cookieParser());

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

  // Rate limiting.
  // Key by the caller's auth token when present (hashed, never stored raw) so that
  // one busy logged-in user can't exhaust the shared quota for everyone else behind
  // the same NAT/campus IP — and so a single user's burst of parallel GraphQL queries
  // (dashboards, cache-and-network refetches on reconnect, etc.) doesn't get them
  // blocked alongside unrelated users. Unauthenticated requests fall back to IP.
  const tokenOrIpKey = (req) => {
    const auth = req.headers.authorization;
    if (auth) return crypto.createHash("sha256").update(auth).digest("hex");
    return req.ip;
  };

  // Generous global cap — a normal SPA session (dashboard widgets, lists, refetch-on-
  // reconnect) can easily fire dozens of GraphQL operations in a short burst. This
  // exists to catch runaway loops/abuse, not to throttle normal usage.
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: tokenOrIpKey,
  });

  // Tighter limit on login/signup, keyed by IP + the email being attempted so that
  // brute-forcing one account doesn't lock out every other user on the same shared IP.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `${req.ip}:${req.body?.variables?.input?.email || ""}`,
    message: { errors: [{ message: "Too many attempts, please try again later." }] },
  });

  // Apply middleware with CORS settings
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : ["http://localhost:3000"];

  // Populate audit context with the requesting userId for every /graphql request
  app.use("/graphql", (req, res, next) => {
    const cookieToken = req.cookies?.auth_token;
    const bearerToken = req.headers.authorization?.replace("Bearer ", "") || null;
    const { userId } = getUser(cookieToken || bearerToken);
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
      context: async ({ req, res }) => {
        // Cookie-first auth: httpOnly cookie for web, bearer header for Electron/Capacitor
        const cookieToken = req.cookies?.auth_token;
        const bearerToken = req.headers.authorization?.replace("Bearer ", "") || null;
        const token = cookieToken || bearerToken;

        const { userId, role } = getUser(token);

        return {
          userId,
          role,
          prisma,
          res,
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

  startNotificationScheduler(prisma);
}

// Start server and catch any errors
startServer().catch((error) => {
  console.error("Error starting server:", error);
});
