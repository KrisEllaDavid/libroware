const userResolvers = require("./user");
const bookResolvers = require("./book");
const authorResolvers = require("./author");
const categoryResolvers = require("./category");
const borrowResolvers = require("./borrow");
const reviewResolvers = require("./review");
const uploadResolvers = require("./upload");

module.exports = {
  Query: {
    ...userResolvers.Query,
    ...bookResolvers.Query,
    ...authorResolvers.Query,
    ...categoryResolvers.Query,
    ...borrowResolvers.Query,
    ...reviewResolvers.Query,
  },

  Mutation: {
    ...userResolvers.Mutation,
    ...bookResolvers.Mutation,
    ...authorResolvers.Mutation,
    ...categoryResolvers.Mutation,
    ...borrowResolvers.Mutation,
    ...reviewResolvers.Mutation,
    ...uploadResolvers.Mutation,
  },

  // Type resolvers
  User: userResolvers.User,
  Book: bookResolvers.Book,
  Author: authorResolvers.Author,
  Category: categoryResolvers.Category,
  Borrow: borrowResolvers.Borrow,
  Review: reviewResolvers.Review,
};
