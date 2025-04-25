const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const cors = require("cors");
require("dotenv").config();

// Simple schema definition
const typeDefs = gql`
  type Query {
    hello: String
  }
`;

// Resolvers map
const resolvers = {
  Query: {
    hello: () => "Hello world!",
  },
};

async function startServer() {
  // Create Express app
  const app = express();

  // Apply middleware
  app.use(cors());
  // Increase JSON payload limit for file uploads (50MB)
  app.use(express.json({ limit: "50mb" }));
  // Increase URL-encoded payload limit as well
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();
  server.applyMiddleware({ app });

  // Define port
  const PORT = process.env.PORT || 4000;

  // Start server
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(
      `GraphQL endpoint at http://localhost:${PORT}${server.graphqlPath}`
    );
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
});
