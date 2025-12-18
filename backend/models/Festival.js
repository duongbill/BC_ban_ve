const mongoose = require("mongoose");

const festivalSchema = new mongoose.Schema({
  id: String,
  name: String,
  symbol: String,
  nftContract: String,
  marketplace: String,
  organiser: String,
  totalTickets: Number,
  ticketsForSale: Number,
  maxTicketsPerWallet: Number,
  maxResalePercentage: Number,
  royaltyPercentage: Number,
});

module.exports = mongoose.model("Festival", festivalSchema);
