const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/banve");

// Festival schema
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
const Festival = mongoose.model("Festival", festivalSchema);

// Ticket schema
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
const Ticket = mongoose.model("Ticket", ticketSchema);

// Get all festivals
app.get("/festivals", async (req, res) => {
  const festivals = await Festival.find();
  res.json(festivals);
});

// Create new festival
app.post("/festivals", async (req, res) => {
  try {
    const festival = new Festival(req.body);
    await festival.save();
    res.json(festival);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete festival by id
app.delete("/festivals/:id", async (req, res) => {
  const result = await Festival.deleteOne({ id: req.params.id });
  res.json({ deleted: result.deletedCount });
});

// Get festival by id
app.get("/festivals/:id", async (req, res) => {
  const festival = await Festival.findOne({ id: req.params.id });
  if (!festival) return res.status(404).json({ error: "Not found" });
  res.json(festival);
});

// Get all tickets (optionally filter by festivalId)
app.get("/tickets", async (req, res) => {
  const { festivalId } = req.query;
  let tickets;
  if (festivalId) {
    tickets = await Ticket.find({ festivalId });
  } else {
    tickets = await Ticket.find();
  }
  res.json(tickets);
});

// Get ticket by tokenId
app.get("/tickets/:tokenId", async (req, res) => {
  const ticket = await Ticket.findOne({ tokenId: req.params.tokenId });
  if (!ticket) return res.status(404).json({ error: "Not found" });
  res.json(ticket);
});

// Create new ticket (buy ticket)
app.post("/tickets", async (req, res) => {
  try {
    const ticket = new Ticket(req.body);
    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update ticket (e.g. resale)
app.put("/tickets/:tokenId", async (req, res) => {
  const ticket = await Ticket.findOneAndUpdate(
    { tokenId: req.params.tokenId },
    req.body,
    { new: true }
  );
  res.json(ticket);
});

// Delete ticket by tokenId
app.delete("/tickets/:tokenId", async (req, res) => {
  const result = await Ticket.deleteOne({ tokenId: req.params.tokenId });
  res.json({ deleted: result.deletedCount });
});

app.listen(4000, () => {
  console.log("Backend server running on http://localhost:4000");
});
