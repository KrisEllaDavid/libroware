const userResolvers        = require("./user");
const bookResolvers        = require("./book");
const authorResolvers      = require("./author");
const categoryResolvers    = require("./category");
const borrowResolvers      = require("./borrow");
const reviewResolvers      = require("./review");
const uploadResolvers      = require("./upload");
const fineResolvers        = require("./fine");
const reservationResolvers = require("./reservation");
const analyticsResolvers   = require("./analytics");

module.exports = {
  Query: {
    ...userResolvers.Query,
    ...bookResolvers.Query,
    ...authorResolvers.Query,
    ...categoryResolvers.Query,
    ...borrowResolvers.Query,
    ...reviewResolvers.Query,
    ...fineResolvers.Query,
    ...reservationResolvers.Query,
    ...analyticsResolvers.Query,
  },

  Mutation: {
    ...userResolvers.Mutation,
    ...bookResolvers.Mutation,
    ...authorResolvers.Mutation,
    ...categoryResolvers.Mutation,
    ...borrowResolvers.Mutation,
    ...reviewResolvers.Mutation,
    ...uploadResolvers.Mutation,
    ...fineResolvers.Mutation,
    ...reservationResolvers.Mutation,
  },

  User:        userResolvers.User,
  Book:        bookResolvers.Book,
  Author:      authorResolvers.Author,
  Category:    categoryResolvers.Category,
  Borrow:      borrowResolvers.Borrow,
  Review:      reviewResolvers.Review,
  Fine:        fineResolvers.Fine,
  Reservation: reservationResolvers.Reservation,
};
