const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  tokenId: Number,
  tokenURI: String,
  purchasePrice: String,
  sellingPrice: String,
  isForSale: Boolean,
  owner: String,
  festivalId: String,
  isGifted: Boolean,
  isVerified: Boolean,
});

module.exports = mongoose.model("Ticket", ticketSchema);
